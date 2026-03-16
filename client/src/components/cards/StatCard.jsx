const StatCard = ({ label, value, change, icon }) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-sm transition">
      <div className="flex justify-between items-start">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {change && <p className="text-sm text-green-600 mt-1">{change}</p>}
    </div>
  );
};

export default StatCard;
