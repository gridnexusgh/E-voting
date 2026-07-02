import { useState } from "react";
import { Pencil, ArrowRight } from "lucide-react";
import { StudentSidebar } from "./StudentSidebar";
import { StudentHeader } from "./StudentHeader";
import { VotingBallotPage } from "./VotingBallotPage";
import { useAuth } from "../../contexts/AuthContext";

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

  const firstName =
    user?.full_name?.split(" ")[0]?.toUpperCase() || "STUDENT";
  const fullName = user?.full_name?.toUpperCase() || "STUDENT NAME";

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
          {/* Welcome Hero */}
          <section className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-lg">
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
              <button className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-1.5 rounded-full text-sm font-semibold transition-colors">
                <span className="w-2 h-2 rounded-full bg-white" />
                VOTE
              </button>
            </div>
          </section>

          {/* Student Profile Card */}
          <section className="relative bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-lg">Student Profile</h3>
              <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white" />
                Active
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-blue-600 overflow-hidden bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=400&fit=crop&crop=face"
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  aria-label="Edit profile picture"
                  className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>

              <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wide">
                {fullName}
              </h2>
              <div className="mt-3 space-y-1 text-gray-500">
                <p>HND Information and Communication Technology</p>
                <p>Faculty of Applied Science and Technology</p>
                <p>Department of Computer Science</p>
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
              <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-colors">
                Vote Now!
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;
