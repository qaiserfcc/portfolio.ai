/**
 * Database Seeding Script
 * Inserts sample data for development and testing
 */

import { initializeDatabase } from './init';
import { createUser, createResume, createPortfolioPhoto, findUserByEmail, getUserPhotoCount, listUserPortfolioPhotos, listUserResumes } from './services';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Database should already be initialized via db:migrate

    // Create sample user (or find existing)
    console.log('Checking for sample user...');
    let user = await findUserByEmail('demo@example.com');
    if (!user) {
      console.log('Creating sample user...');
      user = await createUser({
        email: 'demo@example.com',
        passwordHash: '$2b$10$example.hash.for.demo.user',
        name: 'Demo User',
        role: 'user',
        emailVerified: true,
      });
      console.log(`✅ User created: ${user.id}`);
    } else {
      console.log(`✅ User already exists: ${user.id}`);
    }

    // Create sample portfolio photos (up to limit)
    console.log('Checking sample portfolio photos...');
    const existingPhotos = await listUserPortfolioPhotos(user.id);
    const photosToCreate = [
      { url: 'https://example.com/demo-photo1.jpg', name: 'photo1' },
      { url: 'https://example.com/demo-photo2.jpg', name: 'photo2' },
    ];

    const createdPhotos: string[] = [];
    for (const photoData of photosToCreate) {
      // Check if this photo URL already exists
      const exists = existingPhotos.some(photo => photo.photoUrl === photoData.url);
      if (!exists && existingPhotos.length < 3) {
        console.log(`Creating sample portfolio photo: ${photoData.name}...`);
        const photo = await createPortfolioPhoto({
          userId: user.id,
          photoUrl: photoData.url,
          storageLocation: `file:///tmp/sample-${photoData.name}.jpg`,
          iv: '0123456789abcdef0123456789abcdef',
          authTag: 'fedcba9876543210fedcba9876543210',
        });
        createdPhotos.push(photo.id);
        existingPhotos.push(photo); // Add to our local list
      } else if (exists) {
        console.log(`Sample portfolio photo ${photoData.name} already exists`);
      } else {
        console.log(`Skipping ${photoData.name} - user has reached photo limit`);
      }
    }

    if (createdPhotos.length > 0) {
      console.log(`✅ Photos created: ${createdPhotos.join(', ')}`);
    }

    // Create sample resumes (up to limit)
    console.log('Checking sample resumes...');
    const existingResumes = await listUserResumes(user.id);
    const resumesToCreate = [
      {
        url: 'https://example.com/demo-resume1.pdf',
        filename: 'demo-resume-software-engineer.pdf',
        notes: 'Experienced software engineer with 5+ years in full-stack development, specializing in React, Node.js, and cloud technologies.',
        name: 'software-engineer'
      },
      {
        url: 'https://example.com/demo-resume2.pdf',
        filename: 'demo-resume-data-scientist.pdf',
        notes: 'Data scientist with expertise in machine learning, Python, and big data analytics. Passionate about AI-driven solutions.',
        name: 'data-scientist'
      },
    ];

    const createdResumes: string[] = [];
    for (const resumeData of resumesToCreate) {
      // Check if this resume URL already exists
      const exists = existingResumes.some(resume => resume.resumeUrl === resumeData.url);
      if (!exists && existingResumes.length < 2) {
        console.log(`Creating sample resume: ${resumeData.name}...`);
        const resume = await createResume({
          userId: user.id,
          resumeUrl: resumeData.url,
          originalFilename: resumeData.filename,
          aiNotes: resumeData.notes,
        });
        createdResumes.push(resume.id);
        existingResumes.push(resume); // Add to our local list
      } else if (exists) {
        console.log(`Sample resume ${resumeData.name} already exists`);
      } else {
        console.log(`Skipping ${resumeData.name} - user has reached resume limit`);
      }
    }

    if (createdResumes.length > 0) {
      console.log(`✅ Resumes created: ${createdResumes.join(', ')}`);
    }

    console.log('🎉 Database seeded successfully!');
    console.log(`Sample user email: ${user.email}`);
    console.log('You can now test the application with this data.');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}