
import { v4 as uuidv4 } from 'uuid';
import { Report, ReportStatus } from '../types/report';

// In a real app, this would be connected to your backend service
export const createReport = async (reportData: Partial<Report>): Promise<Report> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const newReport: Report = {
        id: uuidv4(),
        title: reportData.title || 'Untitled Report',
        description: reportData.description || '',
        location: reportData.location || 'Unknown location',
        date: reportData.date || new Date().toISOString(),
        status: 'submitted',
        userId: reportData.userId || '123456',
        evidenceUrls: reportData.evidenceUrls || [],
        crimeType: reportData.crimeType,
        aiAnalysisResults: reportData.aiAnalysisResults,
      };
      
      // Store in local storage for demo purposes
      const existingReports = JSON.parse(localStorage.getItem('reportify_reports') || '[]');
      existingReports.push(newReport);
      localStorage.setItem('reportify_reports', JSON.stringify(existingReports));
      
      resolve(newReport);
    }, 500);
  });
};

export const getReports = async (userId?: string): Promise<Report[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const allReports = JSON.parse(localStorage.getItem('reportify_reports') || '[]');
      
      if (userId) {
        const userReports = allReports.filter((report: Report) => report.userId === userId);
        resolve(userReports);
      } else {
        resolve(allReports);
      }
    }, 500);
  });
};

export const getReportById = async (reportId: string): Promise<Report | null> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const allReports = JSON.parse(localStorage.getItem('reportify_reports') || '[]');
      const report = allReports.find((r: Report) => r.id === reportId);
      resolve(report || null);
    }, 300);
  });
};

export const updateReportStatus = async (reportId: string, status: ReportStatus): Promise<Report> => {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const allReports = JSON.parse(localStorage.getItem('reportify_reports') || '[]');
      const reportIndex = allReports.findIndex((r: Report) => r.id === reportId);
      
      if (reportIndex === -1) {
        reject(new Error('Report not found'));
        return;
      }
      
      allReports[reportIndex].status = status;
      localStorage.setItem('reportify_reports', JSON.stringify(allReports));
      
      resolve(allReports[reportIndex]);
    }, 300);
  });
};

// Mock data for initial loading
export const generateMockReports = (): Report[] => {
  const reports: Report[] = [
    {
      id: '1',
      title: 'Suspicious Activity in Neighborhood Park',
      description: 'I observed several individuals behaving suspiciously near the playground equipment around 10 PM.',
      location: '123 Park Avenue, Springfield',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'under_review',
      userId: '123456',
      evidenceUrls: ['https://via.placeholder.com/300x200?text=Evidence+1'],
      crimeType: 'suspicious_activity',
    },
    {
      id: '2',
      title: 'Vehicle Break-in',
      description: 'My car was broken into overnight. The window is smashed and several items were stolen.',
      location: '456 Oak Street, Springfield',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'investigating',
      userId: '123456',
      evidenceUrls: [
        'https://via.placeholder.com/300x200?text=Evidence+1',
        'https://via.placeholder.com/300x200?text=Evidence+2'
      ],
      crimeType: 'theft',
    },
    {
      id: '3',
      title: 'Graffiti on Public Building',
      description: 'There is new graffiti on the side of the community center that appeared overnight.',
      location: '789 Main Street, Springfield',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'submitted',
      userId: '123456',
      evidenceUrls: ['https://via.placeholder.com/300x200?text=Graffiti+Photo'],
      crimeType: 'vandalism',
    },
  ];
  
  // Initialize localStorage with mock data if empty
  if (!localStorage.getItem('reportify_reports')) {
    localStorage.setItem('reportify_reports', JSON.stringify(reports));
  }
  
  return reports;
};

// Initialize mock data
generateMockReports();
