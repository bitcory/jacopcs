'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { useAuth } from './contexts/AuthContext';
import {
  Home as HomeIcon,
  Users,
  BarChart3,
  Settings,
  Menu,
  RefreshCw,
  LogOut,
  Download,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  Play,
  Pause,
  X,
  GripHorizontal
} from 'lucide-react';

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

  // Audio player state
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Draggable player state
  const [playerPosition, setPlayerPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentRecording]);

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPlayerPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - playerPosition.x,
      y: e.clientY - playerPosition.y
    });
  };

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

  const playRecording = (recording: Recording) => {
    if (currentRecording?.id === recording.id) {
      togglePlayPause();
    } else {
      setCurrentRecording(recording);
      setIsPlaying(true);
      setCurrentTime(0);
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const closePlayer = () => {
    audioRef.current?.pause();
    setCurrentRecording(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const downloadRecording = async (recording: Recording) => {
    try {
      const response = await fetch(recording.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = recording.fileName || `recording_${recording.phoneNumber}_${new Date(recording.recordedAt).toISOString()}.m4a`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(recording.downloadUrl, '_blank');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const employees = [...new Set(recordings.map(r => r.employeeName))].filter(Boolean);

  const filteredRecordings = filter === 'all'
    ? recordings
    : recordings.filter(r => r.employeeName === filter);

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
      {/* Hidden audio element */}
      <audio ref={audioRef} src={currentRecording?.downloadUrl} />

      {/* Floating Draggable Audio Player */}
      {currentRecording && (
        <div
          className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-gray-200 w-80"
          style={{
            left: playerPosition.x,
            top: playerPosition.y,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Drag Handle */}
          <div
            className="flex items-center justify-between px-4 py-2 bg-indigo-600 rounded-t-2xl cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2 text-white">
              <GripHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">오디오 플레이어</span>
            </div>
            <button
              onClick={closePlayer}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Player Content */}
          <div className="p-4">
            {/* Recording Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentRecording.callType === 'incoming' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {currentRecording.callType === 'incoming' ? (
                  <PhoneIncoming className="w-5 h-5 text-green-600" />
                ) : (
                  <PhoneOutgoing className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{currentRecording.phoneNumber}</p>
                <p className="text-sm text-gray-500 truncate">{currentRecording.employeeName}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <input
                type="range"
                min={0}
                max={audioDuration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(audioDuration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
              <button
                onClick={() => downloadRecording(currentRecording)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                title="다운로드"
              >
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

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
            <Phone className="w-6 h-6" />
            <span>통화녹음 관리</span>
          </h1>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white">
                <HomeIcon className="w-5 h-5" />
                대시보드
              </a>
            </li>
            {appUser.role === 'admin' && (
              <li>
                <a href="/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                  <Users className="w-5 h-5" />
                  사용자 관리
                </a>
              </li>
            )}
            <li>
              <a href="/stats" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <BarChart3 className="w-5 h-5" />
                통계
              </a>
            </li>
            <li>
              <a href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <Settings className="w-5 h-5" />
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
            <Download className="w-5 h-5" />
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
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-6 h-6 text-gray-600" />
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
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">새로고침</span>
              </button>

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
                  <img src={appUser.photoURL} alt="Profile" className="w-9 h-9 rounded-full" />
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
                  <LogOut className="w-5 h-5" />
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
                  <Mic className="w-6 h-6 text-indigo-600" />
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
                  <Users className="w-6 h-6 text-emerald-600" />
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
                  <PhoneIncoming className="w-6 h-6 text-green-600" />
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
                  <PhoneOutgoing className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 녹음 목록 */}
          {filteredRecordings.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-gray-400" />
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
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">재생/다운로드</th>
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
                            {recording.callType === 'incoming' ? (
                              <><PhoneIncoming className="w-3 h-3" /> 수신</>
                            ) : (
                              <><PhoneOutgoing className="w-3 h-3" /> 발신</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-mono">{formatDuration(recording.duration)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(recording.recordedAt)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{formatFileSize(recording.fileSize)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => playRecording(recording)}
                              className={`p-2 rounded-full transition-colors ${
                                currentRecording?.id === recording.id && isPlaying
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                              }`}
                              title="재생"
                            >
                              {currentRecording?.id === recording.id && isPlaying ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => downloadRecording(recording)}
                              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                              title="다운로드"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
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
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        recording.callType === 'incoming'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {recording.callType === 'incoming' ? (
                          <><PhoneIncoming className="w-3 h-3" /> 수신</>
                        ) : (
                          <><PhoneOutgoing className="w-3 h-3" /> 발신</>
                        )}
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

                    {/* 재생/다운로드 버튼 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playRecording(recording)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                          currentRecording?.id === recording.id && isPlaying
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        }`}
                      >
                        {currentRecording?.id === recording.id && isPlaying ? (
                          <><Pause className="w-4 h-4" /> 일시정지</>
                        ) : (
                          <><Play className="w-4 h-4" /> 재생</>
                        )}
                      </button>
                      <button
                        onClick={() => downloadRecording(recording)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-4 h-4" /> 다운로드
                      </button>
                    </div>
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
