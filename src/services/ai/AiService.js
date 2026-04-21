const { AzureOpenAI } = require('openai');
const logger = require('../../utils/logger');
const prisma = require('../../prisma/client');

// Available form IDs
const AVAILABLE_FORM_IDS = [
  'cardiac_risk',
  'diabetes_history',
  'lifestyle_questionnaire',
  'respiratory_assessment',
  'hypertension_assessment',
  'mental_health_screening',
  'gastrointestinal_assessment',
  'musculoskeletal_assessment',
  'neurological_assessment',
  'infectious_disease_assessment',
  'kidney_urinary_assessment',
  'allergy_assessment',
  'womens_health_assessment',
  'skin_assessment',
  'general_others_questionnaire',
];

// Initialize Azure OpenAI client
let openaiClient = null;

function getClient() {
  if (openaiClient) return openaiClient;

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;

  if (!endpoint || !apiKey) {
    logger.warn('Azure OpenAI credentials not configured');
    return null;
  }

  openaiClient = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: '2024-10-21',
  });

  return openaiClient;
}

/**
 * Suggest forms based on MO-patient transcript
 * @param {number} caseId - Case ID
 * @param {string} transcript - MO-patient conversation transcript
 * @returns {Promise<{recommended_forms: string[], reasoning: string}>}
 */
async function suggestForms(caseId, transcript) {
  try {
    const client = getClient();
    const modelName = process.env.AZURE_OPENAI_MODEL;

    if (!client || !modelName) {
      throw new Error('Azure OpenAI not configured');
    }

    const systemPrompt = `You are a clinical assistant helping to determine which medical forms a patient should fill out based on their conversation with a Medical Officer.

Available forms:
- cardiac_risk: Cardiac Risk Assessment (for chest pain, heart disease risk, palpitations, cardiovascular symptoms)
- diabetes_history: Diabetes History (for blood sugar issues, diabetes symptoms, diabetic complications)
- lifestyle_questionnaire: Lifestyle Questionnaire (general health habits - always include this)
- respiratory_assessment: Respiratory Assessment (for cough, shortness of breath, asthma, COPD, breathing difficulties)
- hypertension_assessment: Hypertension Assessment (for high blood pressure, headaches, dizziness)
- mental_health_screening: Mental Health Screening (for anxiety, depression, stress, mood disorders)
- gastrointestinal_assessment: Gastrointestinal Assessment (for abdominal pain, nausea, vomiting, bowel issues, digestive problems)
- musculoskeletal_assessment: Musculoskeletal & Joint Assessment (for joint pain, arthritis, back pain, muscle aches)
- neurological_assessment: Neurological Assessment (for headaches, dizziness, numbness, weakness, neurological symptoms)
- infectious_disease_assessment: Infectious Disease & Fever Assessment (for fever, chills, infections, cold/flu symptoms)
- kidney_urinary_assessment: Kidney & Urinary Assessment (for urinary problems, kidney issues, UTI symptoms)
- allergy_assessment: Allergy Assessment (for allergic reactions, food/drug allergies, environmental allergies)
- womens_health_assessment: Women's Health Assessment (for menstrual issues, pelvic pain, gynecological concerns - only for female patients)
- skin_assessment: Skin & Dermatology Assessment (for rash, itching, skin lesions, dermatological problems)
- general_others_questionnaire: General Health Questionnaire (for symptoms that don't fit other categories - use as fallback)

Instructions:
1. Analyse the patient-MO conversation transcript carefully
2. Select 2-4 most relevant forms based on the chief complaint and symptoms discussed
3. ALWAYS include 'lifestyle_questionnaire' as it provides baseline health information
4. If symptoms don't clearly match any specific category, include 'general_others_questionnaire'
5. Only include 'womens_health_assessment' if the patient is female and has gynecological concerns

Return JSON with this exact structure:
{
  "recommended_forms": ["form_id_1", "form_id_2"],
  "reasoning": "Brief clinical reasoning for the selections"
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const completion = await client.chat.completions.create(
        {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Patient-MO conversation transcript:\n\n${transcript}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 500,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const raw = completion.choices[0].message.content;
      const result = JSON.parse(raw);

      // Validate returned form IDs
      const validForms = (result.recommended_forms || []).filter((id) =>
        AVAILABLE_FORM_IDS.includes(id)
      );

      // Ensure lifestyle_questionnaire is always included
      if (!validForms.includes('lifestyle_questionnaire')) {
        validForms.push('lifestyle_questionnaire');
      }

      logger.info(`AI suggested ${validForms.length} forms for case ${caseId}`);

      return {
        recommended_forms: validForms,
        reasoning: result.reasoning || '',
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    logger.error('Error suggesting forms:', error);
    throw new Error(`Failed to suggest forms: ${error.message}`);
  }
}

/**
 * Generate case summary for doctor consultation
 * @param {number} caseId - Case ID
 * @param {string} transcript - MO-patient transcript
 * @param {object} formResponses - Patient form responses
 * @param {object} patientInfo - Patient information {name, age, gender}
 * @param {array} medicalHistory - Patient's previous cases with diagnoses (optional)
 * @returns {Promise<{chiefComplaint, symptoms, riskFactors, possibleDiagnoses, recommendedTests, riskLevel}>}
 */
async function generateCaseSummary(caseId, transcript, formResponses, patientInfo, medicalHistory = []) {
  try {
    const client = getClient();
    const modelName = process.env.AZURE_OPENAI_MODEL;

    if (!client || !modelName) {
      throw new Error('Azure OpenAI not configured');
    }

    // Build form responses text
    const formText = formResponses
      ? Object.entries(formResponses)
          .map(([formId, answers]) => {
            const answersText = Object.entries(answers)
              .map(([q, a]) => `  ${q}: ${a}`)
              .join('\n');
            return `${formId}:\n${answersText}`;
          })
          .join('\n\n')
      : 'No forms submitted';

    const patientText = patientInfo
      ? `Patient: ${patientInfo.name}, Age: ${patientInfo.age}, Gender: ${patientInfo.gender}`
      : 'Patient info not provided';

    // Build medical history text
    let medicalHistoryText = 'No previous medical history available';
    if (medicalHistory && medicalHistory.length > 0) {
      medicalHistoryText = 'Previous Medical History:\n' + medicalHistory.map((visit, idx) => {
        const date = new Date(visit.createdAt).toLocaleDateString();
        const diagnosis = visit.caseRecord?.aiDiagnosisJson?.diagnosis || 'No diagnosis';
        const notes = visit.caseRecord?.doctorNotes || '';
        const summary = visit.caseRecord?.caseSummary;
        
        let historyEntry = `${idx + 1}. Visit on ${date}:`;
        if (summary && summary.chiefComplaint) {
          historyEntry += `\n   Chief Complaint: ${summary.chiefComplaint}`;
        }
        if (summary && summary.possibleDiagnoses) {
          historyEntry += `\n   Diagnoses: ${summary.possibleDiagnoses.join(', ')}`;
        }
        if (typeof diagnosis === 'string') {
          historyEntry += `\n   Final Diagnosis: ${diagnosis}`;
        }
        if (notes) {
          historyEntry += `\n   Doctor's Notes: ${notes}`;
        }
        return historyEntry;
      }).join('\n\n');
    }

    const systemPrompt = `You are a clinical AI assistant generating a pre-consultation case summary for a doctor.
Analyse the Medical Officer-patient transcript (if available) and the patient's submitted form responses, then produce a structured clinical summary.
${!transcript || transcript.trim() === '' ? 'NOTE: No transcript is available for this case. Base your analysis solely on the patient form responses.\n' : ''}
${medicalHistory && medicalHistory.length > 0 ? 'IMPORTANT: This is a FOLLOW-UP visit. Consider the patient\'s medical history when generating the summary. Look for:\n- Progression or resolution of previous conditions\n- New vs. recurring symptoms\n- Continuity of care considerations\n- Chronic condition management\n\n' : ''}Return JSON with this exact structure:
{
  "chiefComplaint": "One sentence summary of the chief complaint",
  "symptoms": ["symptom1", "symptom2"],
  "riskFactors": ["risk factor 1", "risk factor 2"],
  "possibleDiagnoses": ["Diagnosis 1", "Diagnosis 2", "Diagnosis 3"],
  "recommendedTests": ["Test 1", "Test 2", "Test 3"],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}

Be concise and clinically accurate. Provide exactly 3 possible diagnoses ordered by likelihood.`;

    const userPrompt = `${patientText}

${medicalHistoryText}

MO-Patient Transcript:
${transcript || 'No transcript available - patient proceeded directly to forms'}

Patient Form Responses:
${formText}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const completion = await client.chat.completions.create(
        {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1000,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const raw = completion.choices[0].message.content;
      const result = JSON.parse(raw);

      // Store in CaseRecord
      await prisma.caseRecord.update({
        where: { caseId },
        data: {
          caseSummary: result,
        },
      });

      logger.info(`Generated case summary for case ${caseId}`);

      return result;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    logger.error('Error generating case summary:', error);
    throw new Error(`Failed to generate case summary: ${error.message}`);
  }
}

/**
 * Suggest follow-up questions for doctor consultation
 * @param {number} caseId - Case ID
 * @param {string} initialTranscript - Initial consultation transcript
 * @param {object} formResponses - Patient form responses
 * @param {object} patientInfo - Patient information
 * @param {object} caseSummary - AI-generated case summary
 * @param {array} medicalHistory - Patient's previous cases with diagnoses (optional)
 * @returns {Promise<{followUpQuestions: string[]}>}
 */
async function suggestFollowUpQuestions(
  caseId,
  initialTranscript,
  formResponses,
  patientInfo,
  caseSummary,
  medicalHistory = []
) {
  try {
    const client = getClient();
    const modelName = process.env.AZURE_OPENAI_MODEL;

    if (!client || !modelName) {
      throw new Error('Azure OpenAI not configured');
    }

    // Build context from form responses
    const formContext = formResponses
      ? Object.entries(formResponses)
          .map(([formId, answers]) => {
            const answersText = Object.entries(answers)
              .map(([q, a]) => `  ${q}: ${a}`)
              .join('\n');
            return `${formId}:\n${answersText}`;
          })
          .join('\n\n')
      : 'No form data available';

    const patientContext = patientInfo
      ? `Patient: ${patientInfo.name}, Age: ${patientInfo.age}, Gender: ${patientInfo.gender}`
      : '';

    const summaryContext = caseSummary
      ? `Chief Complaint: ${caseSummary.chiefComplaint}
Symptoms: ${caseSummary.symptoms?.join(', ') || 'None'}
Risk Factors: ${caseSummary.riskFactors?.join(', ') || 'None'}
Possible Diagnoses: ${caseSummary.possibleDiagnoses?.join(', ') || 'None'}`
      : '';

    // Build medical history context
    let medicalHistoryContext = '';
    if (medicalHistory && medicalHistory.length > 0) {
      medicalHistoryContext = '\nPrevious Medical History:\n' + medicalHistory.map((visit, idx) => {
        const date = new Date(visit.createdAt).toLocaleDateString();
        const summary = visit.caseRecord?.caseSummary;
        const diagnosis = visit.caseRecord?.aiDiagnosisJson?.diagnosis || '';
        
        return `${idx + 1}. ${date}: ${summary?.chiefComplaint || ''} - ${diagnosis}`;
      }).join('\n');
    }

    const systemPrompt = `You are a clinical AI assistant helping doctors conduct thorough patient consultations.

Based on the initial consultation transcript and patient's submitted forms, identify critical gaps in the clinical history that the doctor should clarify during the consultation.

${medicalHistory && medicalHistory.length > 0 ? 'IMPORTANT: This is a FOLLOW-UP visit. Include questions about:\n- Changes since last visit\n- Treatment compliance and effectiveness\n- New or worsening symptoms\n- Medication adjustments needed\n\n' : ''}Focus on:
1. Missing details about symptom onset, duration, severity, and progression
2. Clarification of contradictions or ambiguities
3. Red flag symptoms that need urgent assessment
4. Social and functional impact questions
5. Medication adherence and side effects
6. Family history relevant to the presenting complaint
7. Specific questions related to differential diagnoses

Return JSON with this exact structure:
{
  "followUpQuestions": [
    "Specific question 1",
    "Specific question 2",
    ...
  ]
}

Provide 4-6 targeted, clinically relevant questions. Keep questions clear and actionable.`;

    const userPrompt = `${patientContext}${medicalHistoryContext}

${summaryContext}

Initial Consultation Transcript:
${initialTranscript}

Patient Form Responses:
${formContext}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // Increased to 25s for large consultation data

    try {
      const completion = await client.chat.completions.create(
        {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 800,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const raw = completion.choices[0].message.content;
      const result = JSON.parse(raw);

      // Store in CaseRecord
      await prisma.caseRecord.update({
        where: { caseId },
        data: {
          followUpQuestions: result.followUpQuestions || [],
        },
      });

      logger.info(`Generated ${result.followUpQuestions?.length || 0} follow-up questions for case ${caseId}`);

      return {
        followUpQuestions: result.followUpQuestions || [],
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    logger.error('Error suggesting follow-up questions:', error);
    throw new Error(`Failed to suggest follow-up questions: ${error.message}`);
  }
}

/**
 * Format consultation data for diagnosis API
 * @param {number} caseId - Case ID
 * @param {number} patientId - Patient ID
 * @param {object} patientInfo - Patient information
 * @param {object} formResponses - Patient form responses
 * @param {string} initialTranscript - Initial consultation transcript
 * @param {string} followUpTranscript - Follow-up consultation transcript
 * @param {object} caseSummary - AI-generated case summary
 * @param {array} medicalHistory - Patient's previous medical history
 * @returns {Promise<object>} - Formatted consultation data
 */
async function formatConsultation(
  caseId,
  patientId,
  patientCode,
  patientInfo,
  formResponses,
  initialTranscript,
  followUpTranscript,
  caseSummary,
  medicalHistory
) {
  try {
    const client = getClient();
    const modelName = process.env.AZURE_OPENAI_MODEL;

    if (!client || !modelName) {
      throw new Error('Azure OpenAI not configured');
    }

    // Use patientCode if available, otherwise fall back to patientId
    // This ensures compatibility with diagnosis API expecting patient codes like "PT-00456"
    const effectivePatientId = patientCode || patientId;

    // Build context - keep most relevant form data
    const formText = formResponses
      ? Object.entries(formResponses)
          .map(([formId, answers]) => {
            const relevantAnswers = Object.entries(answers)
              .filter(([q, a]) => a && a !== 'No' && a !== 'None' && a !== 'N/A') // Filter out empty/negative answers
              .map(([q, a]) => `${q}: ${a}`)
              .join('\n');
            return relevantAnswers ? `${formId}:\n${relevantAnswers}` : '';
          })
          .filter(text => text)
          .join('\n\n')
      : 'No form data available';

    const systemPrompt = `You are a clinical AI assistant formatting consultation data for a diagnosis system.

Extract structured clinical data from the consultation transcripts and form responses.

Return JSON with this exact structure:
{
  "patient_id": "${effectivePatientId}",
  "symptoms": ["present symptom 1", "present symptom 2"],
  "transcript": "Concise clinical summary in 3-4 sentences covering: chief complaint, symptom onset/duration, relevant history, and examination findings. Use 3rd-person clinical language.",
  "medical_history": ["relevant condition 1", "relevant condition 2"] or [] if none,
  "registration_form": {
    "age": "string",
    "sex": "M/F",
    "smoker": "yes/no/former",
    "bmi": "calculate from height/weight if available, or estimate, or unknown",
    "current_medications": "comma-separated list or None",
    "allergies": "comma-separated list or None",
    "family_history": "brief relevant history or None reported"
  }
}

IMPORTANT: Use the exact patient_id value provided above (${effectivePatientId}). Do not modify or change it.
Focus on diagnostically relevant information. Keep the clinical summary brief but comprehensive.`;

    const userPrompt = `Patient ID: ${effectivePatientId}
Patient: ${patientInfo?.name}, Age: ${patientInfo?.age}, Gender: ${patientInfo?.gender}

${medicalHistory && medicalHistory.length > 0 ? `Previous Medical History:
${medicalHistory.map((visit, index) => {
  const visitDate = visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : 'Unknown date';
  const doctorName = visit.doctor?.user?.name || visit.doctor?.name || 'Unknown doctor';
  const diagnosisText = visit.caseRecord?.diagnosisResult?.diagnosis || 'No diagnosis recorded';
  const medications = visit.caseRecord?.diagnosisResult?.medication_prescription || [];
  const medsText = medications.length > 0 ? medications.map(m => m.medication).join(', ') : 'None';
  return `Visit ${index + 1} (${visitDate}, Dr. ${doctorName}):
- Diagnosis: ${diagnosisText}
- Prescribed medications: ${medsText}`;
}).join('\n\n')}

` : ''}Initial Consultation Transcript:
${initialTranscript || 'Not available'}

Follow-up Consultation Transcript:
${followUpTranscript || 'Not available'}

Relevant Patient Form Responses:
${formText}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // Increased to 30s for large consultation data

    try {
      const completion = await client.chat.completions.create(
        {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 2000, // Reduced since we're no longer echoing the full transcript
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const raw = completion.choices[0].message.content;
      
      // Log raw response for debugging
      if (!raw || raw.trim() === '') {
        logger.error('Empty response from Azure OpenAI');
        throw new Error('Empty response from AI service');
      }
      
      logger.debug(`Raw AI response (length: ${raw.length}): ${raw.substring(0, 200)}...`);
      
      const result = JSON.parse(raw);

      // Ensure patient_id matches what we expect (AI sometimes changes it)
      if (result.patient_id !== effectivePatientId) {
        logger.warn(`AI changed patient_id from ${effectivePatientId} to ${result.patient_id}, correcting...`);
        result.patient_id = effectivePatientId;
      }

      logger.info(`Formatted consultation data for case ${caseId} with patient_id ${effectivePatientId}`);

      return result;
    } catch (error) {
      clearTimeout(timeout);
      
      // More detailed error logging
      if (error instanceof SyntaxError) {
        logger.error('JSON Parse Error - Raw content:', error.message);
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error formatting consultation:', error);
    throw new Error(`Failed to format consultation: ${error.message}`);
  }
}

module.exports = {
  suggestForms,
  generateCaseSummary,
  suggestFollowUpQuestions,
  formatConsultation,
};
