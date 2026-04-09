const express = require('express');
const router = express.Router();
// const { ReceptionService } = require('../services/reception');
const { VisitType } = require('../generated/prisma');
const { UserRole } = require('../generated/prisma');
const {UserService} = require('../services/user');
const {PatientService} = require('../services/patient');
const {CaseService} = require('../services/case');
const bcrypt = require('bcrypt');
const { generateRandomString } = require('../utils/helpers');

/**
 * Reception creates case using phone number
 * POST /reception/create-case
 */
router.post('/create-case', async (req, res) => {
  try {

    if(!req.body.name || !req.body.phone || !req.body.age || !req.body.gender || !req.body.reasonForVisit) {
        return res.status(400).json({ error: 'Name, phone, age, gender, and reason for visit are required' });
    }

    const payload = {
      name: req.body.name,
      phone: req.body.phone,
      age: req.body.age,
      gender: req.body.gender,
      reasonForVisit: req.body.reasonForVisit,
      visitType: VisitType.OPD, // default to OPD for reception created cases
    };
    

    const checkIfUserExists = await UserService.getUserByPhone(payload.phone);

    const user = checkIfUserExists ? checkIfUserExists : await UserService.createUser({
        name: payload.name,
        phone: payload.phone,
        // password: await bcrypt.hash(generateRandomString(10), 10), // generate random password for reception created users
        password: await bcrypt.hash(payload.phone, 10),
        role: UserRole.PATIENT
    });

    const checkIfPatientExists = await PatientService.getPatientByUserId(user.id);

    const patient = checkIfPatientExists ? checkIfPatientExists : await PatientService.createPatient({
        userId: user.id,
        age: payload.age,
        gender: payload.gender.toLowerCase()
    });

    const casePayload = {
      patientId: patient.id,
      department: req.body.department ? req.body.department : null,
      visitType: payload.visitType,
      reasonForVisit: payload.reasonForVisit
    };

    const data = await CaseService.createCase(casePayload);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;