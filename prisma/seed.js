const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Doctor account
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctor = await prisma.user.upsert({
    where: { phone: '9000000001' },
    update: {},
    create: {
      name: 'Dr. Rajesh Kumar',
      phone: '9000000001',
      password: doctorPassword,
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          specialization: 'General Medicine',
        },
      },
    },
  });
  console.log('✅ Created Doctor:', doctor.name, `(${doctor.phone})`);

  // Create Medical Officer account
  const moPassword = await bcrypt.hash('mo123', 10);
  const medicalOfficer = await prisma.user.upsert({
    where: { phone: '9000000002' },
    update: {},
    create: {
      name: 'MO Priya Sharma',
      phone: '9000000002',
      password: moPassword,
      role: 'MEDICAL_OFFICER',
    },
  });
  console.log('✅ Created Medical Officer:', medicalOfficer.name, `(${medicalOfficer.phone})`);

  // Create Reception account
  const receptionPassword = await bcrypt.hash('reception123', 10);
  const reception = await prisma.user.upsert({
    where: { phone: '9000000003' },
    update: {},
    create: {
      name: 'Reception Desk',
      phone: '9000000003',
      password: receptionPassword,
      role: 'RECEPTION',
    },
  });
  console.log('✅ Created Reception:', reception.name, `(${reception.phone})`);

  // Create Patient account
  const patientPassword = await bcrypt.hash('patient123', 10);
  const patientUser = await prisma.user.upsert({
    where: { phone: '9000000004' },
    update: {},
    create: {
      name: 'Test Patient',
      phone: '9000000004',
      password: patientPassword,
      role: 'PATIENT',
      patientProfile: {
        create: {
          patientCode: 'P-1001',
          age: 45,
          gender: 'Male',
        },
      },
    },
  });
  console.log('✅ Created Patient:', patientUser.name, `(${patientUser.phone})`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────────────────────');
  console.log('Doctor:         9000000001 / doctor123');
  console.log('Medical Officer: 9000000002 / mo123');
  console.log('Reception:      9000000003 / reception123');
  console.log('Patient:        9000000004 / patient123');
  console.log('─────────────────────────────────────────────────');
  console.log('\n⚠️  Remember to change passwords in production!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
