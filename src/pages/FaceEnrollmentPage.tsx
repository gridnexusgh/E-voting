import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Vote,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ScanFace,
  Sun,
  Eye,
  User,
  X,
} from 'lucide-react';
import { supabase, invokeEdgeFunction } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export function FaceEnrollmentPage() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { user, updateUserFaceEnrollment, refreshUser } = useAuth();

  useEffect(() => {
    checkUserStatus();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function checkUserStatus() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      navigate('/login');
      return;
    }

    setAuthUserId(authUser.id);

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_face_enrolled')
      .eq('id', authUser.id)
      .single();

    if (error) {
      setError('Unable to verify enrollment status. Please refresh and try again.');
      setIsLoading(false);
      return;
    }

    if (userData?.is_face_enrolled) {
      setIsEnrolled(true);
      setIsLoading(false);
      return;
    }

    requestCameraAccess();
  }

  async function requestCameraAccess() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraPermission('denied');
    } finally {
      setIsLoading(false);
    }
  }

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  function retakeImage() {
    setCapturedImage(null);
    setError('');
    requestCameraAccess();
  }

  async function submitEnrollment() {
    if (!capturedImage) return;

    setIsUploading(true);
    setError('');

    try {
      const base64Data = capturedImage.split(',')[1];
      const userId = authUserId || user?.id;

      if (!userId) {
        setError('Unable to identify your account. Please sign out and sign in again.');
        return;
      }

      const functionData = await invokeEdgeFunction('face-enrollment', {
        userId,
        imageBase64: base64Data,
        profileImageUrl: capturedImage,
        demo: true,
      });

      if (functionData?.success) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_face_enrolled: true })
          .eq('id', userId);

        if (updateError) {
          setError('Failed to update enrollment status. Please contact support.');
          return;
        }

        updateUserFaceEnrollment();
        await refreshUser();
        setIsEnrolled(true);
      } else {
        setError(functionData?.error || 'Face detection failed. Please ensure your face is clearly visible.');
      }
} catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function goToDashboard() {
    navigate('/student/dashboard');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Enrollment Complete!</h1>
          <p className="text-gray-600 mb-8">
            Your facial enrollment was successful. You're now ready to participate in university elections.
          </p>
          <button
            onClick={goToDashboard}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_24%),linear-gradient(135deg,_#f8fbff_0%,_#eef5ff_45%,_#dbeafe_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-blue-600 shadow-xl">
            <Vote className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-slate-900">Facial Enrollment</h1>
          <p className="text-base text-slate-600">
            Complete facial enrollment to activate your voting access and strengthen account security.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
          {cameraPermission === 'denied' ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-900">Camera Access Required</h2>
              <p className="mb-6 text-slate-600">
                Please allow camera access to complete facial enrollment. Check your browser settings and try again.
              </p>
              <button
                onClick={requestCameraAccess}
                className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-slate-900">Before You Begin</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Sun, text: 'Ensure good lighting' },
                    { icon: Eye, text: 'Look directly at camera' },
                    { icon: User, text: 'Remove face coverings' },
                    { icon: X, text: 'No other faces visible' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <item.icon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="text-sm text-slate-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mb-6">
                <div className="relative aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden">
                  {capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captured face"
                      className="w-full h-full object-cover"
                    />
                  ) : stream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="text-gray-400">Starting camera...</span>
                      </div>
                    </div>
                  )}

                  {stream && !capturedImage && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-56 h-56 sm:w-64 sm:h-64 border-4 border-white/50 rounded-full border-dashed"></div>
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                        <p className="text-white text-sm font-medium">Position your face in the circle</p>
                      </div>
                    </>
                  )}

                  {capturedImage && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-56 h-56 sm:w-64 sm:h-64 border-4 border-green-500 rounded-full"></div>
                      </div>
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Captured
                      </div>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {capturedImage ? (
                  <>
                    <button
                      onClick={retakeImage}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Retake</span>
                    </button>
                    <button
                      onClick={submitEnrollment}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold transition-colors shadow-md"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Submit Enrollment</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={captureImage}
                    disabled={!stream}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors shadow-md"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Photo</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <ScanFace className="h-4 w-4" />
            Your facial data is encrypted and securely stored
          </p>
        </div>
      </div>
    </div>
  );
}
