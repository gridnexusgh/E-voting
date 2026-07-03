import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { StudentSidebar } from "./StudentSidebar";
import { StudentHeader } from "./StudentHeader";
import { VotingBallotPage } from "./VotingBallotPage";
import { useAuth } from "../../contexts/AuthContext";
import {
  GeneralElectionResult,
  FacultyElectionResult,
  DepartmentElectionResult,
} from "./ElectionResults";
import { StudentSlotsPage } from "./StudentSlotsPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { supabase, invokeEdgeFunction } from "../../services/supabase";

const AnnouncementPage = () => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 text-center">
    <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
    <p className="mt-2 text-gray-500">
      No new announcements from the Election Officer at this time.
    </p>
  </section>
);

const votingSteps = [
  {
    title: "Initiate Ballot Entry",
    body:
      "Open the navigation sidebar and click on 'Vote', or simply click the 'Vote Now!' action button located below these instructions.",
  },
  {
    title: "Identity Verification",
    body:
      "Complete the secure biometric verification check using the integrated biometric facial recognition system to unlock your official ballot.",
  },
  {
    title: "Review Candidates",
    body:
      "Browse the available positions and identify the visual profile card of the candidate you wish to support.",
  },
  {
    title: "Cast Your Vote",
    body:
      "Tap, hold, and drag the candidate's profile card directly into the digital ballot box container to lock in your choice. Successful submissions will display a celebratory ribbon animation.",
  },
  {
    title: "Complete All Slots",
    body:
      "Click 'Next' on the success confirmation screen to proceed and cast your votes for the remaining student governance positions.",
  },
];

export function StudentDashboard() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isVerifiedForVote, setIsVerifiedForVote] = useState(false);

  const firstName =
    user?.full_name?.split(" ")[0]?.toUpperCase() || "STUDENT";
  const fullName = user?.full_name?.toUpperCase() || "STUDENT NAME";

  const [facultyName, setFacultyName] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const u = user;

    async function loadNames() {
      try {
        if (u.faculty_id) {
          const { data: fac } = await supabase
            .from('faculties')
            .select('name')
            .eq("id", u.faculty_id)
            .maybeSingle();
          setFacultyName(fac?.name ?? null);
        }

        if (u.department_id) {
          const { data: dept } = await supabase
            .from('departments')
            .select('name')
            .eq("id", u.department_id)
            .maybeSingle();
          setDepartmentName(dept?.name ?? null);
        }
      } catch {
        // ignore errors; fall back to ids
      }
    }

    loadNames();
  }, [user?.faculty_id, user?.department_id]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar
        collapsed={sidebarCollapsed}
        activeItem={activeItem}
        onSelect={setActiveItem}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {activeItem === "vote" ? (
            isVerifiedForVote ? (
              <VotingBallotPage onExit={() => setActiveItem("dashboard")} />
            ) : (
              <FaceVerificationGate onVerified={() => setIsVerifiedForVote(true)} />
            )
          ) : activeItem === "general" ? (
            <GeneralElectionResult />
          ) : activeItem === "faculty" ? (
            <FacultyElectionResult />
          ) : activeItem === "department" ? (
            <DepartmentElectionResult />
          ) : activeItem === "slots" ? (
            <StudentSlotsPage />
          ) : activeItem === "announcement" ? (
            <AnnouncementPage />
          ) : activeItem === "reset-password" ? (
            <ResetPasswordPage />
          ) : (
          <>
          {/* Welcome Hero */}
          <section className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white shadow-lg">
            <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full bg-white/5" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Welcome Back, {firstName}
                <span className="italic">!</span>
              </h2>
              <p className="mt-3 flex items-center gap-2 text-blue-50">
                <span className="w-2 h-2 rounded-full bg-blue-200" />
                Computer Science Department Election Ongoing
              </p>
              <button
                onClick={() => setActiveItem("vote")}
                className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                VOTE
              </button>
            </div>
          </section>

          {/* Student Profile Card */}
          <section className="relative bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-lg">Student Profile</h3>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white" />
                Active
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-[#0C1E4E] overflow-hidden bg-gray-100">
                  {user?.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt="Student profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500">
                      <span className="text-4xl font-bold">
                        {firstName?.[0] || "S"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wide">
                {fullName}
              </h2>
              <div className="mt-3 space-y-1 text-gray-500">
                <p>{user?.role === 'student' ? 'Verified Student' : 'Student'}</p>
                {user?.faculty_id ? <p>Faculty: {facultyName ?? user.faculty_id}</p> : null}
                {user?.department_id ? <p>Department: {departmentName ?? user.department_id}</p> : null}
              </div>
            </div>
          </section>

          {/* Voting Guide */}
          <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
            <div className="inline-block bg-red-600 text-white font-semibold px-4 py-2 rounded-md">
              HOW DO I VOTE?
            </div>
            <h4 className="mt-6 text-lg sm:text-xl font-semibold text-gray-900">
              Here is the step by step guide on how to vote
            </h4>

            <ol className="mt-6 space-y-5 list-decimal list-inside pl-2 sm:pl-6">
              {votingSteps.map((step) => (
                <li key={step.title} className="text-gray-700">
                  <span className="font-semibold text-gray-900">
                    {step.title}
                  </span>{" "}
                  <span className="text-gray-500">– {step.body}</span>
                </li>
              ))}
            </ol>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setActiveItem("vote")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] hover:opacity-90 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-opacity"
              >
                Vote Now!
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
          </>
          )}
        </main>
      </div>
    </div>
  );
}
function FaceVerificationGate({ onVerified }: { onVerified: () => void }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    requestCameraAccess();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // run once on mount — do not depend on `stream` which causes restart loops
  }, []);

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

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
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

  function handleVerify() {
    if (!capturedImage) {
      setError('Please capture your face first.');
      return;
    }

    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const base64 = capturedImage.split(',')[1];
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        const userId = authUser?.id || null;
        if (!userId) {
          setError('Unable to identify account. Please sign in again.');
          return;
        }

        // Check whether user already has enrollment status
        try {
          const { data: dbUser, error: dbErr } = await supabase
            .from('users')
            .select('is_face_enrolled')
            .eq('id', userId)
            .maybeSingle();

          if (dbErr) {
            console.error('Error fetching user face data:', dbErr);
          }

          if (!dbUser || !dbUser.is_face_enrolled) {
            setError('No facial enrollment found. Please complete enrollment at /face-enrollment before verifying.');
            return;
          }
        } catch (e) {
          console.error('DB check error:', e);
        }

        const result = await invokeEdgeFunction('face-verify', {
          userId,
          imageBase64: base64,
          demo: true,
        });

        console.debug('face-verify result', result);

        if (result?.error) {
          if (String(result.error).includes('Stored face data not found')) {
            setError('No enrolled face data found. Please enroll first.');
          } else {
            setError('Verification service error. Please try again later.');
          }
          return;
        }

        if (typeof result?.score !== 'number') {
          setError('Unable to compute similarity at this time. Please try again later.');
          return;
        }

        const score = Number(result.score);
        if (score > 0 && result.match) {
          onVerified();
        } else if (score === 0) {
          setError('Unable to verify your face (no similarity detected). Ensure good lighting and try again.');
        } else {
          setError(`Face did not match (score: ${score.toFixed(3)}). Try again.`);
        }
      } catch (err: any) {
        const message = err?.message || String(err) || 'Verification service error';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_24%),linear-gradient(135deg,_#f8fbff_0%,_#eef5ff_45%,_#dbeafe_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-blue-600 shadow-xl">
            <Camera className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-slate-900">Facial Verification</h1>
          <p className="text-base text-slate-600">
            Please verify your identity with a quick face scan before you cast your vote.
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
                Please allow camera access to complete facial verification. Check your browser settings and try again.
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
                  ) : isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="text-gray-400">Starting camera...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-white">Camera is not available.</p>
                    </div>
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
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Retake</span>
                    </button>
                    <button
                      onClick={handleVerify}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-md"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Verify Face</span>
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
      </div>
    </div>
  );
}
export default StudentDashboard;
