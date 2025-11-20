/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FaCheck,
  FaEye,
  FaFileUpload,
  FaImage,
  FaMagic,
  FaPlay,
  FaSignOutAlt,
  FaTrash,
  FaUser,
  FaCloudUploadAlt,
  FaList,
} from 'react-icons/fa';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';
import Modal from '@/components/ui/Modal';
import { DashboardSummary } from '@/types/dashboard';

interface UploadResponse {
  error?: string;
  message?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [aiNotes, setAiNotes] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'resumes' | 'photos'>('upload');
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: string; photoUrl: string } | null>(null);
  const [selectedResume, setSelectedResume] = useState<{ id: string; originalFilename: string; resumeUrl: string } | null>(null);

  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    refreshDashboard();
  }, []);

  const refreshDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as UploadResponse;
        throw new Error(data.error || 'Failed to load dashboard');
      }
      const summary = (await response.json()) as DashboardSummary;
      setDashboard(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!dashboard?.limits.canUploadMoreResumes) {
      setError('Maximum 2 resumes allowed. Please delete an existing resume first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      if (aiNotes) {
        formData.append('aiNotes', aiNotes);
      }
      if (additionalContext) {
        formData.append('additionalContext', additionalContext);
      }

      const response = await fetch('/api/portfolio/resumes', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess('Resume uploaded successfully!');
        setAiNotes('');
        setAdditionalContext('');
        await refreshDashboard();
        setActiveTab('resumes');
      } else {
        const data = (await response.json().catch(() => ({}))) as UploadResponse;
        setError(data.error || 'Failed to upload resume');
      }
    } catch (err) {
      setError('An error occurred while uploading');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!dashboard?.limits.canUploadMorePhotos) {
      setError('Maximum 3 portfolio photos allowed. Please delete a photo first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/portfolio/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess('Photo uploaded successfully!');
        await refreshDashboard();
        setActiveTab('photos');
      } else {
        const data = (await response.json().catch(() => ({}))) as UploadResponse;
        setError(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError('An error occurred while uploading');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/portfolio/photos?id=${photoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Photo deleted successfully!');
        await refreshDashboard();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete photo');
      }
    } catch (err) {
      setError('An error occurred while deleting');
      console.error('Delete error:', err);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/portfolio/resumes?id=${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Resume deleted successfully!');
        await refreshDashboard();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete resume');
      }
    } catch (err) {
      setError('An error occurred while deleting');
      console.error('Delete error:', err);
    }
  };

  const handleGeneratePortfolio = async (resumeId: string) => {
    setIsGenerating(resumeId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeId }),
      });

      if (response.ok) {
        setSuccess('Portfolio generated successfully!');
        await refreshDashboard();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to generate portfolio');
      }
    } catch (err) {
      setError('An error occurred while generating portfolio');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleViewPhoto = (photo: { id: string; photoUrl: string }) => {
    setSelectedPhoto(photo);
  };

  const handlePreviewResume = async (resume: { id: string; originalFilename: string }) => {
    try {
      // Get the resume file URL from the API
      const response = await fetch(`/api/files/resume/${resume.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setSelectedResume({ id: resume.id, originalFilename: resume.originalFilename, resumeUrl: url });
      } else {
        setError('Failed to load resume for preview');
      }
    } catch (err) {
      setError('An error occurred while loading resume');
      console.error('Resume preview error:', err);
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload Content', icon: FaCloudUploadAlt },
    { id: 'resumes', label: 'My Resumes', icon: FaList },
    { id: 'photos', label: 'My Photos', icon: FaImage },
  ];

  return (
    <Section className="bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950 dark:via-indigo-950/30 dark:to-purple-950/50 min-h-screen">
      <Container>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FaUser className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-sm uppercase text-gray-500 tracking-wide">Portfolio Dashboard</p>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Welcome back, {dashboard?.user.name || 'Creator'}
                  </h1>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Upload your resume and photos to generate your AI-powered portfolio site.
              </p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <FaSignOutAlt />
              Logout
            </button>
          </div>

          {/* Stats Cards */}
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Resumes" value={dashboard.stats.resumeCount} max={dashboard.limits.maxResumes} accent="text-indigo-600" />
              <StatCard label="Photos" value={dashboard.stats.photoCount} max={dashboard.limits.maxPhotos} accent="text-purple-600" />
              <StatCard label="Portfolios" value={dashboard.stats.portfolioCount} accent="text-green-600" />
              <StatCard label="Slots Left" value={Math.min(dashboard.limits.maxResumes - dashboard.stats.resumeCount, dashboard.limits.maxPhotos - dashboard.stats.photoCount)} accent="text-orange-600" />
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 rounded-lg">
              {success}
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'upload' | 'resumes' | 'photos')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Resume Upload */}
                  <div className="bg-white/80 dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-indigo-100/20 dark:border-indigo-700/20">
                    <div className="flex items-center gap-3 mb-6">
                      <FaFileUpload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload Resume</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Notes (Optional)</label>
                        <textarea
                          value={aiNotes}
                          onChange={(e) => setAiNotes(e.target.value)}
                          placeholder="Add notes about your experience, skills, or specific requirements..."
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Context (Optional)</label>
                        <textarea
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                          placeholder="Any additional information, preferences, or context for portfolio generation..."
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    </div>

                    <label
                      className={`flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                        dashboard?.limits.canUploadMoreResumes
                          ? 'border-indigo-300 dark:border-indigo-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                      }`}
                    >
                      <input ref={resumeInputRef} type="file" accept=".pdf,.docx,.txt,.md" onChange={handleResumeUpload} disabled={!dashboard?.limits.canUploadMoreResumes || isUploading} className="hidden" />
                      <FaFileUpload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-center">
                        {isUploading ? 'Uploading...' : dashboard?.limits.canUploadMoreResumes ? 'Click to upload resume\n(PDF, DOCX, TXT, MD)' : 'Maximum resumes reached'}
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Maximum {dashboard?.limits.maxResumes ?? 2} resumes • Up to 10MB each</p>
                  </div>

                  {/* Photo Upload */}
                  <div className="bg-white/80 dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-purple-100/20 dark:border-purple-700/20">
                    <div className="flex items-center gap-3 mb-6">
                      <FaImage className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload Photos</h2>
                    </div>

                    <label
                      className={`flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer mb-6 ${
                        dashboard?.limits.canUploadMorePhotos
                          ? 'border-purple-300 dark:border-purple-600 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                      }`}
                    >
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={!dashboard?.limits.canUploadMorePhotos || isUploading} className="hidden" />
                      <FaImage className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-center">
                        {isUploading ? 'Uploading...' : dashboard?.limits.canUploadMorePhotos ? 'Click to upload photo\n(JPG, PNG, WebP)' : 'Maximum photos reached'}
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">Maximum {dashboard?.limits.maxPhotos ?? 3} photos • Up to 5MB each</p>

                    {/* Photo Preview Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {dashboard?.photos.slice(0, 3).map((photo) => (
                        <div key={photo.id} className="relative group cursor-pointer" onClick={() => handleViewPhoto(photo)}>
                          <img src={photo.photoUrl} alt="Portfolio" className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105" />
                          <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} aria-label="Delete photo" className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Resumes Tab */}
              {activeTab === 'resumes' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-indigo-100/20 dark:border-indigo-700/20">
                  <div className="flex items-center gap-3 mb-6">
                    <FaList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Your Resumes</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({dashboard?.resumes.length || 0} uploaded)</span>
                  </div>

                  {dashboard?.resumes.length === 0 ? (
                    <div className="text-center py-12">
                      <FaFileUpload className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No resumes uploaded yet</h3>
                      <p className="text-gray-500 dark:text-gray-500 mb-4">Upload your first resume to get started with AI portfolio generation.</p>
                      <button onClick={() => setActiveTab('upload')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        Upload Resume
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboard?.resumes?.map((resume) => (
                        <div key={resume.id} className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 dark:text-white">{resume.originalFilename}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}</p>
                            {resume.aiNotes && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 truncate">{resume.aiNotes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePreviewResume(resume)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                            >
                              <FaEye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              onClick={() => handleDeleteResume(resume.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                            >
                              <FaTrash className="w-4 h-4" />
                              Delete
                            </button>
                            {!resume.portfolioGenerated ? (
                              <button
                                onClick={() => handleGeneratePortfolio(resume.id)}
                                disabled={isGenerating === resume.id}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all disabled:opacity-50"
                              >
                                <FaMagic className="w-4 h-4" />
                                {isGenerating === resume.id ? 'Generating...' : 'Generate Portfolio'}
                              </button>
                            ) : (
                              <button onClick={() => router.push(resume.publicUrl || '#')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-all">
                                <FaEye className="w-4 h-4" /> View Portfolio
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-purple-100/20 dark:border-purple-700/20">
                  <div className="flex items-center gap-3 mb-6">
                    <FaImage className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Your Photos</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({dashboard?.photos.length || 0} uploaded)</span>
                  </div>

                  {dashboard?.photos.length === 0 ? (
                    <div className="text-center py-12">
                      <FaImage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No photos uploaded yet</h3>
                      <p className="text-gray-500 dark:text-gray-500 mb-4">Add some photos to personalize your portfolio.</p>
                      <button onClick={() => setActiveTab('upload')} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                        Upload Photos
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {dashboard?.photos?.map((photo) => (
                        <div key={photo.id} className="relative group cursor-pointer" onClick={() => handleViewPhoto(photo)}>
                          <img src={photo.photoUrl} alt="Portfolio" className="w-full h-64 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                            aria-label="Delete photo"
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </Container>

      {/* Photo Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Photo Preview"
        size="xl"
      >
        {selectedPhoto && (
          <div className="flex justify-center">
            <img
              src={selectedPhoto.photoUrl}
              alt="Portfolio"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>

      {/* Resume Modal */}
      <Modal
        isOpen={!!selectedResume}
        onClose={() => {
          if (selectedResume?.resumeUrl) {
            URL.revokeObjectURL(selectedResume.resumeUrl);
          }
          setSelectedResume(null);
        }}
        title={`Resume Preview - ${selectedResume?.originalFilename}`}
        size="full"
      >
        {selectedResume && (
          <div className="w-full h-[80vh]">
            <iframe
              src={selectedResume.resumeUrl}
              className="w-full h-full border-0 rounded-lg"
              title={`Preview of ${selectedResume.originalFilename}`}
            />
          </div>
        )}
      </Modal>
    </Section>
  );
}

function StatCard({ label, value, max, accent }: { label: string; value: number; max?: number; accent: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-gray-800/50 p-4 rounded-lg shadow-md backdrop-blur-sm border border-indigo-100/20 dark:border-indigo-700/20">
      <div className={`text-2xl font-bold ${accent}`}>{value}{max ? `/${max}` : ''}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </motion.div>
  );
}
