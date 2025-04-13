import { getGeminiResponse } from './gemini';
import { addDays } from 'date-fns';

// Generate a personalized study plan based on content and preferences
export const generateStudyPlan = async (content, preferences) => {
  try {
    const { difficulty, timeAvailable, daysToComplete, learningStyle } = preferences;
    
    const prompt = `
    Create a personalized study plan for a student based on the following content and preferences.
    
    Content to study:
    ${content}
    
    Student preferences:
    - Difficulty level: ${difficulty} (1-5, where 5 is most difficult)
    - Available study time per day: ${timeAvailable} minutes
    - Days to complete: ${daysToComplete} days
    - Learning style preference: ${learningStyle}
    
    Please create a structured study plan that includes:
    1. A breakdown of topics to cover each day
    2. Recommended study sessions with durations
    3. Strategic breaks to maintain focus
    4. Review sessions to reinforce learning
    5. Practice activities or exercises
    
    Format your response as a JSON object with this structure:
    {
      "overview": "Brief overview of the study plan approach",
      "days": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "sessions": [
            {
              "title": "Session title",
              "type": "study|break|review|practice",
              "duration": 30,
              "topics": ["Topic 1", "Topic 2"],
              "description": "Description of what to do in this session"
            }
          ]
        }
      ],
      "tips": ["Study tip 1", "Study tip 2"]
    }
    
    Ensure the plan is realistic, balanced, and tailored to the student's preferences. Write in a friendly, conversational tone without using markdown formatting.
    `;
    
    try {
      const response = await getGeminiResponse(prompt);
      
      // Extract JSON from the response
      try {
        // Find JSON object in the response text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const plan = JSON.parse(jsonStr);
          
          // Add dates to the plan
          const dates = generatePlanDates(new Date(), daysToComplete);
          if (plan && plan.days) {
            plan.days = plan.days.map((day, index) => ({
              ...day,
              date: dates[index] || addDays(new Date(dates[0]), index).toISOString().split('T')[0]
            }));
          }
          
          return plan;
        } else {
          console.error('Could not extract valid JSON from response');
          return generateFallbackPlan(content, preferences);
        }
      } catch (error) {
        console.error('Error parsing study plan JSON:', error);
        return generateFallbackPlan(content, preferences);
      }
    } catch (error) {
      console.error('Error getting Gemini response:', error);
      return generateFallbackPlan(content, preferences);
    }
  } catch (error) {
    console.error('Error generating study plan:', error);
    return generateFallbackPlan(content, preferences);
  }
};

// Generate a study plan specifically for PDF content
export const generatePDFStudyPlan = async (pdfContent, preferences) => {
  try {
    const { difficulty, timeAvailable, daysToComplete, learningStyle } = preferences;
    
    const prompt = `
    Create a personalized study plan for a student based on the following PDF content and preferences.
    
    PDF content:
    ${pdfContent}
    
    Student preferences:
    - Difficulty level: ${difficulty} (1-5, where 5 is most difficult)
    - Available study time per day: ${timeAvailable} minutes
    - Days to complete: ${daysToComplete} days
    - Learning style preference: ${learningStyle}
    
    Please create a structured study plan that includes:
    1. A breakdown of topics to cover each day
    2. Recommended study sessions with durations
    3. Strategic breaks to maintain focus
    4. Review sessions to reinforce learning
    5. Practice activities or exercises
    
    Format your response as a JSON object with this structure:
    {
      "overview": "Brief overview of the study plan approach",
      "days": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "sessions": [
            {
              "title": "Session title",
              "type": "study|break|review|practice",
              "duration": 30,
              "topics": ["Topic 1", "Topic 2"],
              "description": "Description of what to do in this session"
            }
          ]
        }
      ],
      "tips": ["Study tip 1", "Study tip 2"]
    }
    
    Ensure the plan is realistic, balanced, and tailored to the student's preferences. Write in a friendly, conversational tone without using markdown formatting.
    `;
    
    try {
      const response = await getGeminiResponse(prompt);
      
      // Extract JSON from the response
      try {
        // Find JSON object in the response text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const plan = JSON.parse(jsonStr);
          
          // Add dates to the plan
          const dates = generatePlanDates(new Date(), daysToComplete);
          if (plan && plan.days) {
            plan.days = plan.days.map((day, index) => ({
              ...day,
              date: dates[index] || addDays(new Date(dates[0]), index).toISOString().split('T')[0]
            }));
          }
          
          return plan;
        } else {
          console.error('Could not extract valid JSON from response');
          return generateFallbackPlan(pdfContent, preferences);
        }
      } catch (error) {
        console.error('Error parsing PDF study plan JSON:', error);
        return generateFallbackPlan(pdfContent, preferences);
      }
    } catch (error) {
      console.error('Error getting Gemini response for PDF study plan:', error);
      return generateFallbackPlan(pdfContent, preferences);
    }
  } catch (error) {
    console.error('Error generating PDF study plan:', error);
    return generateFallbackPlan(pdfContent, preferences);
  }
};

// Generate a fallback study plan when the API fails
export const generateFallbackPlan = (content, preferences) => {
  const { difficulty, timeAvailable, daysToComplete, learningStyle } = preferences;
  
  // Extract potential topics from content
  const words = content.split(/\s+/);
  const potentialTopics = [];
  
  // Look for capitalized words that might be topics
  for (let i = 0; i < words.length; i++) {
    const word = words[i].trim();
    if (word.length > 4 && word[0] === word[0].toUpperCase() && !word.includes('.')) {
      if (!potentialTopics.includes(word) && potentialTopics.length < 5) {
        potentialTopics.push(word);
      }
    }
  }
  
  // If we couldn't find enough topics, add some generic ones
  if (potentialTopics.length < 3) {
    potentialTopics.push('Main Concept', 'Key Principles', 'Applications');
  }
  
  // Create a simple study plan
  const days = [];
  const sessionsPerDay = Math.max(2, Math.min(4, Math.floor(timeAvailable / 30)));
  const studySessionDuration = Math.floor(timeAvailable / sessionsPerDay);
  
  const dates = generatePlanDates(new Date(), daysToComplete);
  
  for (let i = 0; i < daysToComplete; i++) {
    const sessions = [];
    
    // Add study sessions
    for (let j = 0; j < sessionsPerDay - 1; j++) {
      const topicIndex = (i + j) % potentialTopics.length;
      sessions.push({
        title: `Study Session ${j + 1}`,
        type: 'study',
        duration: studySessionDuration,
        topics: [potentialTopics[topicIndex]],
        description: `Focus on understanding ${potentialTopics[topicIndex]} and related concepts.`
      });
      
      // Add a break after each study session (except the last one)
      if (j < sessionsPerDay - 2) {
        sessions.push({
          title: 'Break',
          type: 'break',
          duration: 10,
          topics: [],
          description: 'Take a short break to rest your mind. Stretch, hydrate, or take a brief walk.'
        });
      }
    }
    
    // Add a review session at the end of each day
    sessions.push({
      title: 'Review Session',
      type: 'review',
      duration: 20,
      topics: ['Daily Review'],
      description: 'Review what you learned today. Create summary notes or flashcards to reinforce your understanding.'
    });
    
    days.push({
      day: i + 1,
      date: dates[i],
      sessions
    });
  }
  
  // Create learning style-specific tips
  const generalTips = [
    'Break your study sessions into 25-30 minute focused blocks with short breaks in between.',
    'Review material from previous days before starting new topics.',
    'Get enough sleep to help consolidate your learning.',
    'Stay hydrated and take regular breaks to maintain focus.'
  ];
  
  const styleSpecificTips = {
    visual: [
      'Use diagrams, charts, and mind maps to visualize concepts.',
      'Color-code your notes to organize information visually.',
      'Watch educational videos on the topics you\'re studying.'
    ],
    auditory: [
      'Record yourself reading key points and listen to the recordings.',
      'Discuss concepts out loud, even if you\'re talking to yourself.',
      'Use text-to-speech tools to listen to your study materials.'
    ],
    reading: [
      'Take detailed notes and rewrite them in your own words.',
      'Create written summaries of key concepts.',
      'Use flashcards with written questions and answers.'
    ],
    kinesthetic: [
      'Apply concepts through hands-on activities or experiments.',
      'Walk around while reviewing your notes or listening to recordings.',
      'Use physical objects to represent abstract concepts when possible.'
    ]
  };
  
  const tips = [
    ...generalTips,
    ...(styleSpecificTips[learningStyle] || styleSpecificTips.visual)
  ];
  
  return {
    overview: `This ${daysToComplete}-day study plan is designed to help you master the material at a difficulty level ${difficulty}/5, with approximately ${timeAvailable} minutes of study time each day. The plan is tailored to your ${learningStyle} learning style and includes strategic breaks to maintain focus and optimize learning.`,
    days,
    tips
  };
};

// Helper function to generate dates for the study plan
export const generatePlanDates = (startDate, daysToComplete) => {
  const dates = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < daysToComplete; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
  }
  
  return dates;
};

// Helper function to estimate study time needed based on content length
export const estimateStudyTime = (content) => {
  // Rough estimate: 1 minute per 100 characters of content
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute
  const studyTime = readingTime * 3; // Study time is typically 3x reading time
  
  return {
    readingTime,
    studyTime,
    recommendedDays: Math.max(1, Math.ceil(studyTime / 120)) // Recommend max 2 hours per day
  };
};
