'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { useAuth } from './contexts/AuthContext';

interface Recording {
  id: string;
  fileName: string;
  phoneNumber: string;
  callType: string;
  duration: number;
  recordedAt: number;
  uploadedAt: number;
  employeeName: string;
  employeeId: string;
  employeePhone: string;
  downloadUrl: string;
  fileSize: number;
}

export default function Home() {
  const { user, appUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (appUser && appUser.status !== 'approved') {
        router.push('/pending');
      }
    }
  }, [user, appUser, authLoading, router]);

  useEffect(() => {
    if (appUser?.status === 'approved') {
      fetchRecordings();
    }
  }, [appUser]);

  const fetchRecordings = async () => {
    try {
      const q = query(collection(db, 'recordings'), orderBy('recordedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recording[];
      setRecordings(data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const employees = [...new Set(recordings.map(r => r.employeeId))];

  const filteredRecordings = filter === 'all'
    ? recordings
    : recordings.filter(r => r.employeeId === filter);

  if (authLoading || loading || !user || !appUser || appUser.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">로딩중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📞</span>
            <span>통화녹음 관리</span>
          </h1>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                대시보드
              </a>
            </li>
            {appUser.role === 'admin' && (
              <li>
                <a href="/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  사용자 관리
                </a>
              </li>
            )}
            <li>
              <a href="/stats" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                통계
              </a>
            </li>
            <li>
              <a href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                설정
              </a>
            </li>
          </ul>
        </nav>

        {/* 하단 영역 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 space-y-4">
          {/* 직원 필터 */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">직원 필터</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">전체 직원</option>
              {employees.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>

          {/* 앱 다운로드 버튼 */}
          <a
            href="/jcopcs.apk"
            download
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            앱 다운로드
          </a>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="lg:ml-64">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              {/* 모바일 햄버거 메뉴 */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">대시보드</h2>
                <p className="text-sm text-gray-500 hidden sm:block">통화녹음 현황을 한눈에 확인하세요</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchRecordings}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">새로고침</span>
              </button>

              {/* 사용자 정보 */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-sm font-medium text-gray-700">{appUser.displayName}</p>
                    {appUser.role === 'admin' && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                        관리자
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{appUser.email}</p>
                </div>
                {appUser.photoURL ? (
                  <img
                    src={appUser.photoURL}
                    alt="Profile"
                    className="w-9 h-9 rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">
                      {appUser.displayName?.charAt(0) || appUser.email?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="로그아웃"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 본문 */}
        <main className="p-4 lg:p-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">전체 녹음</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{recordings.length}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">직원 수</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{employees.length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">수신 통화</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">
                    {recordings.filter(r => r.callType === 'incoming').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">발신 통화</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">
                    {recordings.filter(r => r.callType === 'outgoing').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 녹음 목록 */}
          {filteredRecordings.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-gray-500">녹음 파일이 없습니다</p>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 */}
              <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">직원</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">전화번호</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">통화시간</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">녹음일시</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">크기</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">재생</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecordings.map((recording) => (
                      <tr key={recording.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {recording.employeeName?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{recording.employeeName}</div>
                              <div className="text-sm text-gray-500">{recording.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-mono">{recording.phoneNumber}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            recording.callType === 'incoming'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {recording.callType === 'incoming' ? '↓ 수신' : '↑ 발신'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-mono">{formatDuration(recording.duration)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(recording.recordedAt)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{formatFileSize(recording.fileSize)}</td>
                        <td className="px-6 py-4">
                          <audio controls className="h-8 w-48">
                            <source src={recording.downloadUrl} type="audio/m4a" />
                          </audio>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 뷰 */}
              <div className="lg:hidden space-y-4">
                {filteredRecordings.map((recording) => (
                  <div key={recording.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {recording.employeeName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{recording.employeeName}</div>
                          <div className="text-sm text-gray-500">{recording.employeeId}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        recording.callType === 'incoming'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {recording.callType === 'incoming' ? '↓ 수신' : '↑ 발신'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">전화번호</p>
                        <p className="font-mono text-gray-900">{recording.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">통화시간</p>
                        <p className="font-mono text-gray-900">{formatDuration(recording.duration)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">녹음일시</p>
                        <p className="text-gray-900">{formatDate(recording.recordedAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">파일크기</p>
                        <p className="text-gray-900">{formatFileSize(recording.fileSize)}</p>
                      </div>
                    </div>

                    <audio controls className="w-full h-10">
                      <source src={recording.downloadUrl} type="audio/m4a" />
                    </audio>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
