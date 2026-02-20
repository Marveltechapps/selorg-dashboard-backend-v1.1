/**
 * Seed Training Videos Script
 * 
 * This script populates the training_videos collection with initial training videos.
 * Run this script once to set up the training module.
 * 
 * Usage: node src/picker/scripts/seedTrainingVideos.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TrainingVideo = require('../models/trainingVideo.model');

// Training videos data
const videos = [
  {
    videoId: 'video1',
    title: 'What is Picking?',
    description: 'Learn the basics of order picking and understand your role as a picker',
    duration: 300, // 5 minutes in seconds
    durationDisplay: '5 min',
    videoUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video1.mp4',
    thumbnailUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video1-thumb.jpg',
    order: 1,
    minimumWatchPercentage: 80,
    isActive: true
  },
  {
    videoId: 'video2',
    title: 'How to use the HSD',
    description: 'Comprehensive guide on using the Handheld Scanning Device (HSD)',
    duration: 600, // 10 minutes in seconds
    durationDisplay: '10 min',
    videoUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video2.mp4',
    thumbnailUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video2-thumb.jpg',
    order: 2,
    minimumWatchPercentage: 80,
    isActive: true
  },
  {
    videoId: 'video3',
    title: 'Safety Rules',
    description: 'Essential safety protocols and guidelines for warehouse operations',
    duration: 480, // 8 minutes in seconds
    durationDisplay: '8 min',
    videoUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video3.mp4',
    thumbnailUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video3-thumb.jpg',
    order: 3,
    minimumWatchPercentage: 80,
    isActive: true
  },
  {
    videoId: 'video4',
    title: 'Packing Standards',
    description: 'Learn proper packing techniques and quality standards',
    duration: 720, // 12 minutes in seconds
    durationDisplay: '12 min',
    videoUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video4.mp4',
    thumbnailUrl: 'https://selorg-training-videos.s3.ap-south-1.amazonaws.com/video4-thumb.jpg',
    order: 4,
    minimumWatchPercentage: 80,
    isActive: true
  }
];

async function seedTrainingVideos() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/selorg';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing training videos
    console.log('Clearing existing training videos...');
    const deleteResult = await TrainingVideo.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing videos`);

    // Insert new training videos
    console.log('Inserting training videos...');
    const result = await TrainingVideo.insertMany(videos);
    console.log(`Successfully seeded ${result.length} training videos`);

    // Display seeded videos
    console.log('\nSeeded videos:');
    result.forEach(video => {
      console.log(`  - ${video.videoId}: ${video.title} (${video.durationDisplay})`);
    });

    console.log('\nTraining videos seeded successfully!');
  } catch (error) {
    console.error('Error seeding training videos:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
if (require.main === module) {
  seedTrainingVideos()
    .then(() => {
      console.log('Seed script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = seedTrainingVideos;
