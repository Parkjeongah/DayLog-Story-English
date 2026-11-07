import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed and running standalone, do not display install buttons
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'navbar' ? (
        <button
          onClick={handleInstallClick}
          aria-label="안드로이드 폰 홈 화면에 앱 설치하기"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all shadow-xs active:scale-95"
          title="안드로이드 폰 홈 화면에 앱으로 설치하여 전체 화면으로 실행하기"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>앱 설치</span>
        </button>
      ) : (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 border border-indigo-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h4 className="text-sm font-bold">안드로이드 앱으로 홈 화면에 추가</h4>
              <p className="text-xs text-indigo-200 mt-0.5">
                앱처럼 빠르고 전체 화면으로 매일 일과를 기록하세요.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            aria-label="안드로이드 앱 홈 화면 설치 창 열기"
            title="스마트폰 홈 화면에 바로가기 앱으로 설치하기"
            className="px-4 py-2 rounded-xl bg-white text-indigo-950 font-extrabold text-xs shrink-0 shadow-sm hover:bg-indigo-50 transition-all active:scale-95"
          >
            설치하기
          </button>
        </div>
      )}

      {/* Android & Mobile Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-label="앱 설치 안내">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {isIOS ? 'iPhone / iPad 앱 설치 안내' : '안드로이드 폰 앱 설치 안내'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                aria-label="앱 설치 안내 팝업 닫기"
                title="안내창 닫기"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-slate-50 rounded-xl flex items-start space-x-2.5">
                  <Share2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">1단계:</strong> Safari 브라우저 하단의 <strong>공유(Share)</strong> 아이콘을 탭합니다.
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex items-start space-x-2.5">
                  <PlusSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">2단계:</strong> 메뉴에서 <strong>'홈 화면에 추가'</strong>를 누르면 설치가 완료됩니다.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-slate-50 rounded-xl flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    Chrome 브라우저 우측 상단 <strong>메뉴 [ ⋮ ]</strong> 버튼을 탭합니다.
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    메뉴에서 <strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong>를 선택합니다.
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    바탕화면에 생성된 <strong>DayLog</strong> 아이콘으로 언제든 바로 실행할 수 있습니다.
                  </div>
                </div>
              </div>
            )}

            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  setShowGuideModal(false);
                }}
                aria-label="지금 즉시 앱 설치 팝업 띄우기"
                title="브라우저 설치 팝업 실행"
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                지금 즉시 설치 창 띄우기
              </button>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              aria-label="안내창 닫기"
              title="닫기"
              className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
};
