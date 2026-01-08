'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function PendingPage() {
  const { user, appUser, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (appUser?.status === 'approved') {
        router.push('/');
      }
    }
  }, [user, appUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">로딩중...</div>
        </div>
      </div>
    );
  }

  if (appUser?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">접근 거부됨</h1>
            <p className="text-gray-500 mb-6">
              관리자가 접근 요청을 거부했습니다.<br />
              문의가 필요하시면 관리자에게 연락하세요.
            </p>
            <button
              onClick={logout}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">승인 대기중</h1>
          <p className="text-gray-500 mb-6">
            관리자의 승인을 기다리고 있습니다.<br />
            승인되면 대시보드에 접근할 수 있습니다.
          </p>

          {/* 사용자 정보 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              {appUser?.photoURL ? (
                <img
                  src={appUser.photoURL}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-lg">
                    {appUser?.displayName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="text-left">
                <p className="font-medium text-gray-800">{appUser?.displayName}</p>
                <p className="text-sm text-gray-500">{appUser?.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            다른 계정으로 로그인
          </button>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          통화녹음 관리 시스템 v1.0
        </p>
      </div>
    </div>
  );
}
