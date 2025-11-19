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
  FaUserShield,
  FaUsers,
} from 'react-icons/fa';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';
import OnboardingChecklist, { ChecklistItem } from '@/components/dashboard/OnboardingChecklist';
import { DashboardSummary } from '@/types/dashboard';

interface UploadResponse {
  error?: string;
  message?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [aiNotes, setAiNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const resumeSectionRef = useRef<HTMLDivElement | null>(null);
  const photoSectionRef = useRef<HTMLDivElement | null>(null);

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

      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess('Resume uploaded successfully!');
        setAiNotes('');
        await refreshDashboard();
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

  const resumeSlotsLeft = Math.max(0, (dashboard?.limits.maxResumes || 0) - (dashboard?.stats.resumeCount || 0));
  const photoSlotsLeft = Math.max(0, (dashboard?.limits.maxPhotos || 0) - (dashboard?.stats.photoCount || 0));

  const onboardingItems: ChecklistItem[] = useMemo(() => {
    if (!dashboard) return [];
    return [
      {
        id: 'resume',
        title: 'Upload your first resume',
        description: 'PDF, DOCX, TXT, or MD up to 10 MB',
        done: dashboard.stats.resumeCount > 0,
      },
      {
        id: 'photos',
        title: 'Add brand-safe photos',
        description: 'Up to 3 hero photos for your public site',
        done: dashboard.stats.photoCount > 0,
      },
      {
        id: 'portfolio',
        title: 'Generate your AI portfolio',
        description: 'We create a multi-page site you can share',
        done: dashboard.stats.portfolioCount > 0,
      },
    ];
  }, [dashboard]);

  const firstGeneratedPortfolio = dashboard?.portfolios[0];
  const firstPendingResume = dashboard?.resumes.find((resume) => !resume.portfolioGenerated);

  const scrollToSection = (section: React.RefObject<HTMLDivElement | null>) => {
    section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const quickActions = [
    {
      id: 'upload-resume',
      title: 'Upload Resume',
      description: dashboard?.limits.canUploadMoreResumes ? 'Kick off AI analysis' : 'Limit reached',
      icon: <FaFileUpload className="w-5 h-5" />,
      onClick: () => resumeInputRef.current?.click(),
      disabled: !dashboard?.limits.canUploadMoreResumes,
    },
    {
      id: 'upload-photo',
      title: 'Add Photos',
      description: dashboard?.limits.canUploadMorePhotos ? 'Personalize your site' : 'Limit reached',
      icon: <FaImage className="w-5 h-5" />,
      onClick: () => photoInputRef.current?.click(),
      disabled: !dashboard?.limits.canUploadMorePhotos,
    },
    {
      id: 'generate',
      title: 'Generate Portfolio',
      description: firstPendingResume ? 'Use AI to publish' : 'Upload resume first',
      icon: <FaMagic className="w-5 h-5" />,
      onClick: () => firstPendingResume && handleGeneratePortfolio(firstPendingResume.id),
      disabled: !firstPendingResume,
    },
    {
      id: 'view',
      title: 'View Latest',
      description: firstGeneratedPortfolio ? 'Open public site' : 'Generate first',
      icon: <FaEye className="w-5 h-5" />,
      onClick: () => firstGeneratedPortfolio && router.push(firstGeneratedPortfolio.publicUrl),
      disabled: !firstGeneratedPortfolio,
    },
  ];

  return (
    <Section className="bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950 dark:via-indigo-950/30 dark:to-purple-950/50 min-h-screen">
      <Container>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
            <div>
              <p className="text-sm uppercase text-gray-500 tracking-wide">Welcome back</p>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Creator Dashboard
              </h1>
              {dashboard?.stats.portfolioCount ? (
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {dashboard.stats.portfolioCount} live portfolio{dashboard.stats.portfolioCount > 1 ? 's' : ''} ready to share.
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Upload resumes and photos to generate your first AI-crafted site.
                </p>
              )}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <FaSignOutAlt />
              Logout
            </button>
          </div>

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

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-white/70">AI Builder</p>
                <h2 className="text-3xl font-bold mb-2">Launch your personal site in three steps</h2>
                <p className="text-white/80 max-w-2xl">
                  Upload a resume, add a few photos, and our AI will author a multi-page portfolio for you.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => resumeInputRef.current?.click()} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold">
                  <FaFileUpload /> Upload Resume
                </button>
                <button onClick={() => photoInputRef.current?.click()} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold">
                  <FaImage /> Upload Photos
                </button>
                <button
                  onClick={() => (firstPendingResume ? handleGeneratePortfolio(firstPendingResume.id) : scrollToSection(resumeSectionRef))}
                  className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold"
                >
                  <FaPlay /> Generate Portfolio
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Resumes" value={dashboard?.stats.resumeCount ?? 0} accent="text-indigo-600" />
                <StatCard label="Photos" value={dashboard?.stats.photoCount ?? 0} accent="text-purple-600" />
                <StatCard label="Portfolio Slots" value={resumeSlotsLeft} accent="text-green-600" />
                <StatCard label="Photo Slots" value={photoSlotsLeft} accent="text-orange-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`text-left p-4 rounded-xl border shadow-sm backdrop-blur-sm transition ${
                      action.disabled
                        ? 'bg-gray-100 dark:bg-gray-800/40 text-gray-400 cursor-not-allowed'
                        : 'bg-white/80 dark:bg-gray-800/60 hover:-translate-y-1 hover:shadow-lg text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2 text-indigo-600 dark:text-indigo-300">
                      {action.icon}
                      <span className="font-semibold">{action.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <motion.div ref={resumeSectionRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-indigo-100/20 dark:border-indigo-700/20">
                  <div className="flex items-center gap-3 mb-4">
                    <FaFileUpload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resume Upload</h2>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Notes (Optional)</label>
                    <textarea
                      value={aiNotes}
                      onChange={(e) => setAiNotes(e.target.value)}
                      placeholder="Add any additional notes or context for AI portfolio generation..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  <label
                    className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                      dashboard?.limits.canUploadMoreResumes
                        ? 'border-indigo-300 dark:border-indigo-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    }`}
                  >
                    <input ref={resumeInputRef} type="file" accept=".pdf,.docx,.txt,.md" onChange={handleResumeUpload} disabled={!dashboard?.limits.canUploadMoreResumes || isUploading} className="hidden" />
                    <FaFileUpload className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {isUploading ? 'Uploading...' : dashboard?.limits.canUploadMoreResumes ? 'Upload Resume (PDF, DOCX, TXT, MD)' : 'Maximum resumes reached'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Maximum {dashboard?.limits.maxResumes ?? 2} resumes • Up to 10MB each</p>
                </motion.div>

                <motion.div ref={photoSectionRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/80 dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-indigo-100/20 dark:border-indigo-700/20">
                  <div className="flex items-center gap-3 mb-4">
                    <FaImage className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Portfolio Photos</h2>
                  </div>
                  <label
                    className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer mb-4 ${
                      dashboard?.limits.canUploadMorePhotos
                        ? 'border-purple-300 dark:border-purple-600 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    }`}
                  >
                    <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={!dashboard?.limits.canUploadMorePhotos || isUploading} className="hidden" />
                    <FaImage className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {isUploading ? 'Uploading...' : dashboard?.limits.canUploadMorePhotos ? 'Upload Photo (JPG, PNG, WebP)' : 'Maximum photos reached'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Maximum {dashboard?.limits.maxPhotos ?? 3} photos • Up to 5MB each</p>

                  <div className="grid grid-cols-3 gap-2">
                    {dashboard?.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img src={photo.photoUrl} alt="Portfolio" className="w-full h-24 object-cover rounded-lg" />
                        <button onClick={() => handleDeletePhoto(photo.id)} aria-label="Delete photo" className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {dashboard && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-indigo-100/20 dark:border-indigo-700/20 mb-8">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Resumes</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <FaCheck className="text-green-500" /> {dashboard.stats.portfolioCount} portfolio(s) live
                    </div>
                  </div>

                  {dashboard.resumes.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Finish your setup</h3>
                        <OnboardingChecklist items={onboardingItems} />
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">Need inspiration?</h3>
                        <p className="text-sm text-purple-900/80 dark:text-purple-100/90">
                          Upload any resume and we will craft Home, About, Projects, and Contact pages automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.resumes.map((resume) => (
                        <div key={resume.id} className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">{resume.originalFilename}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboard?.metadata.showFamilyLink && (
                  <Link href="/family">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white/80 dark:bg-gray-800/50 p-8 rounded-xl shadow-lg border border-indigo-100/20 dark:border-indigo-700/20 hover:shadow-xl transition-all cursor-pointer">
                      <FaUsers className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Family Pages</h2>
                      <p className="text-gray-700 dark:text-gray-300">Access and manage family member portfolios</p>
                    </motion.div>
                  </Link>
                )}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 dark:bg-gray-800/50 p-8 rounded-xl shadow-lg border border-indigo-100/20 dark:border-indigo-700/20">
                  <FaUserShield className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your Role</h2>
                  <p className="text-gray-700 dark:text-gray-300 capitalize">{dashboard?.user.role || 'user'} access</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    You can upload {dashboard?.limits.maxResumes ?? 2} resumes and {dashboard?.limits.maxPhotos ?? 3} photos under the current plan.
                  </p>
                </motion.div>
              </div>
            </>
          )}
        </motion.div>
      </Container>
    </Section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-gray-800/50 p-4 rounded-lg shadow-md backdrop-blur-sm border border-indigo-100/20 dark:border-indigo-700/20">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </motion.div>
  );
}
