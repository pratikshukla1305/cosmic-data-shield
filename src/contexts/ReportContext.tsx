
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Report } from '../types/report';
import { getReports, createReport, updateReportStatus } from '../services/reportService';
import { toast } from 'sonner';

interface ReportContextType {
  reports: Report[];
  loading: boolean;
  error: string | null;
  refreshReports: (userId?: string) => Promise<void>;
  submitReport: (report: Partial<Report>) => Promise<Report>;
  updateStatus: (reportId: string, status: Report['status']) => Promise<Report>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshReports = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedReports = await getReports(userId);
      setReports(fetchedReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (reportData: Partial<Report>): Promise<Report> => {
    try {
      setLoading(true);
      const newReport = await createReport(reportData);
      setReports(prevReports => [...prevReports, newReport]);
      toast.success('Report submitted successfully');
      return newReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit report';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reportId: string, status: Report['status']): Promise<Report> => {
    try {
      setLoading(true);
      const updatedReport = await updateReportStatus(reportId, status);
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId ? updatedReport : report
        )
      );
      toast.success(`Report status updated to ${status}`);
      return updatedReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update report status';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshReports();
  }, []);

  return (
    <ReportContext.Provider value={{
      reports,
      loading,
      error,
      refreshReports,
      submitReport,
      updateStatus
    }}>
      {children}
    </ReportContext.Provider>
  );
};
