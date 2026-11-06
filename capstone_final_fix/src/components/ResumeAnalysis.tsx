import React, { useState, useRef } from 'react';
import { Upload, FileText, BarChart3, Target, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface ResumeAnalysisProps {
  userEmail: string;
}

interface ATSAnalysis {
  overall_score: number;
  component_scores: {
    keywords: { score: number; weight: number };
    format: { score: number; weight: number };
    content: { score: number; weight: number };
    completeness: { score: number; weight: number };
  };
  recommendations: string[];
  strengths: string[];
}

interface Resume {
  id: number;
  filename: string;
  ats_score: number | null;
  ats_analysis: ATSAnalysis & { not_a_resume?: boolean; message?: string };
  created_at: string;
}

interface JobMatch {
  job: {
    title: string;
    company: string;
    location: string;
    salary_range: string;
    remote_friendly: boolean;
    url?: string;
    source?: string;
  };
  match_score: number;
  recommendation_reason: string;
}

interface ImprovementSuggestion {
  id: number;
  category: string;
  priority: string;
  suggestion: string;
  explanation: string;
  is_implemented: boolean;
}

export const ResumeAnalysis: React.FC<ResumeAnalysisProps> = ({ userEmail }) => {
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'jobs' | 'improvements'>('upload');
  const [atsTooLowForJobs, setAtsTooLowForJobs] = useState(false);
  const [atsTooLowMessage, setAtsTooLowMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_email', userEmail);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentResume({
          id: data.resume_id,
          filename: file.name,
          ats_score: data.ats_score ?? null,
          ats_analysis: data.analysis || {},
          created_at: new Date().toISOString()
        });
        setActiveTab('analysis');
        
        await getJobRecommendations(data.resume_id);
        
        // Only generate improvement suggestions for actual resumes (not certificates/application forms)
        if (!data.not_a_resume) {
          await generateImprovements(data.resume_id);
        }
      } else {
        console.error('Upload failed:', response.status, response.statusText);
        let message = '';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorJson = await response.json();
            message = errorJson.error || response.statusText || 'Unknown error';
          } else {
            const text = await response.text();
            message = text || response.statusText || 'Unknown error';
          }
        } catch (e) {
          message = response.statusText || 'Unknown error';
        }
        alert(`Upload failed (${response.status}): ${message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getJobRecommendations = async (resumeId: number) => {
    try {
      const response = await fetch(`/api/jobs/recommendations/${resumeId}`);
        if (response.ok) {
        const data = await response.json();
        setJobMatches(Array.isArray(data.matches) ? data.matches.slice(0, 5) : []);
        setAtsTooLowForJobs(Boolean(data.ats_too_low));
        setAtsTooLowMessage(data.message || '');
      }
    } catch (error) {
      console.error('Error getting job recommendations:', error);
    }
  };

  const generateImprovements = async (resumeId: number) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/improvements/generate/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_role: 'Software Engineer',
          regenerate: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error generating improvements:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const implementSuggestion = async (suggestionId: number) => {
    try {
      const response = await fetch(`/api/improvements/implement/${suggestionId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuggestions(prev => 
          prev.map(s => 
            s.id === suggestionId 
              ? { ...s, is_implemented: true }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Error implementing suggestion:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Resume Analysis & Job Matching</h1>
          <p className="text-blue-100">Upload your resume to get ATS scores, job recommendations, and improvement suggestions</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'upload', label: 'Upload Resume', icon: Upload },
              { id: 'analysis', label: 'ATS Analysis', icon: BarChart3 },
              { id: 'jobs', label: 'Job Matches', icon: Target },
              { id: 'improvements', label: 'Improvements', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Upload Your Resume
                </h3>
                <p className="text-gray-500 mb-6">
                  Drag and drop your resume here, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </button>
                <p className="text-sm text-gray-400 mt-4">
                  Supported formats: PDF, DOCX, DOC, TXT (Max 16MB)
                </p>
              </div>

              {currentResume && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">Resume Uploaded Successfully!</h4>
                      <p className="text-green-600">
                        {currentResume.filename} - ATS Score: {currentResume.ats_score ?? 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && currentResume && (
            <div className="space-y-6">
              {currentResume.ats_analysis?.not_a_resume ? (
                /* Certificate / application form — no ATS score */
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">Not a resume</h3>
                  <p className="text-amber-800 text-sm">
                    {currentResume.ats_analysis?.message || 'This doesn\'t appear to be a resume (e.g. certificate or application form). ATS score and analysis are for resumes only. Job matches are based only on extracted skills.'}
                  </p>
                  <p className="text-amber-700 text-sm mt-3">Upload your resume (experience, skills, education) for full ATS analysis and scoring.</p>
                </div>
              ) : (
                <>
                  {/* Overall Score */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">ATS Compatibility Score</h3>
                        <p className="text-gray-600">How well your resume performs with Applicant Tracking Systems</p>
                      </div>
                      <div className={`text-6xl font-bold ${getScoreColor(currentResume.ats_score ?? 0)}`}>
                        {currentResume.ats_score ?? 0}%
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">Scores are calculated from your uploaded resume (sections, keywords, format, and content). <strong>Weight</strong> is how much each category contributes to the overall score.</p>

                  {/* Component Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(currentResume.ats_analysis?.component_scores ?? {}).map(([component, data]) => (
                      <div key={component} className={`rounded-lg p-4 ${getScoreBgColor(data?.score ?? 0)}`}>
                        <h4 className="font-semibold text-gray-800 capitalize mb-2">{component}</h4>
                        <div className={`text-2xl font-bold ${getScoreColor(data?.score ?? 0)}`}>
                          {data?.score ?? 0}%
                        </div>
                        <div className="text-sm text-gray-600" title="How much this category counts toward the overall ATS score">Weight: {data?.weight ?? 0}%</div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths and Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-6">
                      <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {(currentResume.ats_analysis?.strengths ?? []).map((strength, index) => (
                          <li key={index} className="text-green-700 text-sm">• {strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-6">
                      <h4 className="font-semibold text-yellow-800 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {(currentResume.ats_analysis?.recommendations ?? []).map((rec, index) => (
                          <li key={index} className="text-yellow-700 text-sm">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Job Matches Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-2xl font-bold text-gray-800">Job Recommendations</h3>
                <div className="flex items-center gap-4">
                  {/* Always show ATS score when we have a resume (so user sees it even when below 30) */}
                  {currentResume && !currentResume?.ats_analysis?.not_a_resume && (
                    <span className="text-sm font-medium text-gray-700">
                      Your ATS score: <span className={getScoreColor(currentResume.ats_score ?? 0)}>{currentResume.ats_score ?? 0}%</span>
                    </span>
                  )}
                  {!currentResume?.ats_analysis?.not_a_resume && !atsTooLowForJobs && (currentResume?.ats_score != null && currentResume.ats_score >= 30) && (
                    <span className="text-sm text-gray-500">{jobMatches.length} matches found</span>
                  )}
                </div>
              </div>

              {/* Not a resume (certificate, application form) — no job matches */}
              {currentResume?.ats_analysis?.not_a_resume && (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
                  <h4 className="text-xl font-semibold text-amber-800 mb-2">Job matches not available</h4>
                  <p className="text-amber-800 text-sm max-w-lg mx-auto">
                    Job recommendations are shown only for resumes. Upload your resume (experience, skills, education) to get job matches.
                  </p>
                </div>
              )}

              {/* Resume with ATS < 30% — increase ATS score first */}
              {!currentResume?.ats_analysis?.not_a_resume && (atsTooLowForJobs || (currentResume?.ats_score != null && currentResume.ats_score < 30)) && currentResume && (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
                  <h4 className="text-xl font-semibold text-amber-800 mb-2">Increase ATS score</h4>
                  <p className="text-amber-800 text-sm max-w-lg mx-auto">
                    {atsTooLowMessage || 'Your ATS score is below 30%. Job matches are shown only when your score is 30% or higher. Use the Analysis and Improvements tabs to improve your resume, then re-upload to get job recommendations.'}
                  </p>
                  <p className="text-amber-700 text-sm mt-3 font-medium">
                    Current ATS score: {currentResume?.ats_score ?? 0}% — aim for at least 30%
                  </p>
                </div>
              )}

              {/* Show job list only when ATS score is 30% or higher; never show when below 30 */}
              {(currentResume?.ats_analysis?.not_a_resume || atsTooLowForJobs || (currentResume?.ats_score != null && currentResume.ats_score < 30)) ? null : (
              <div className="grid gap-6">
                {jobMatches.map((match, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800">{match.job.title}</h4>
                        <p className="text-gray-600">{match.job.company} • {match.job.location}</p>
                        <p className="text-green-600 font-medium">{match.job.salary_range}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(match.match_score)}`}>
                          {match.match_score}%
                        </div>
                        <div className="text-sm text-gray-500">Match Score</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-2 mb-4">
                      {match.job.remote_friendly && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Remote Friendly
                        </span>
                      )}
                      {match.job.source && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          {match.job.source}
                        </span>
                      )}
                      {match.job.url && (
                        <a
                          href={match.job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          Apply →
                        </a>
                      )}
                    </div>
                    
                    <p className="text-gray-700 text-sm">{match.recommendation_reason}</p>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Improvements Tab */}
          {activeTab === 'improvements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">Improvement Suggestions</h3>
                {isAnalyzing && (
                  <div className="text-sm text-gray-500">Analyzing...</div>
                )}
              </div>

              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">{suggestion.category}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">{suggestion.suggestion}</h4>
                        <p className="text-gray-600 text-sm">{suggestion.explanation}</p>
                      </div>
                      <button
                        onClick={() => implementSuggestion(suggestion.id)}
                        disabled={suggestion.is_implemented}
                        className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          suggestion.is_implemented
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {suggestion.is_implemented ? 'Implemented' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

