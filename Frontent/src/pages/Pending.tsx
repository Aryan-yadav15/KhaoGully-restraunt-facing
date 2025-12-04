const Pending = () => {
  return (
    <div className="max-w-2xl mx-auto mt-16">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-10 text-center">
        <div className="w-20 h-20 bg-[#1C8C3C]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#1C8C3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-[#1A1A1A]">Account Pending Approval</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your restaurant owner account is currently under review by our admin team.
        </p>
        <div className="bg-[#F5F5F5] rounded-xl p-6 max-w-md mx-auto border border-gray-200">
          <p className="text-[#1A1A1A] font-medium text-sm">
            You will be notified once your account has been approved and a restaurant UID has been assigned.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please check back later or contact support if you have any questions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pending;
