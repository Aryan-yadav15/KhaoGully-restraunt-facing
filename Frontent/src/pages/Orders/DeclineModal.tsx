import { useState } from 'react';

interface DeclineModalProps {
  itemName: string;
  totalQuantity: number;
  onConfirm: (declineQuantity: number) => void;
  onCancel: () => void;
}

const DeclineModal: React.FC<DeclineModalProps> = ({
  itemName,
  totalQuantity,
  onConfirm,
  onCancel,
}) => {
  const [declineQuantity, setDeclineQuantity] = useState(0);

  const handleIncrement = () => {
    if (declineQuantity < totalQuantity) {
      setDeclineQuantity(declineQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (declineQuantity > 0) {
      setDeclineQuantity(declineQuantity - 1);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeclineQuantity(parseInt(e.target.value));
  };

  const acceptingQuantity = totalQuantity - declineQuantity;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-secondary mb-1">Partial Decline</h3>
          <p className="text-gray-500">How many <span className="font-semibold text-secondary">"{itemName}"</span> to decline?</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Total Requested</span>
            <span className="text-2xl font-bold text-gray-800">{totalQuantity}</span>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Select quantity to decline:</label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleDecrement}
                disabled={declineQuantity === 0}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-bold text-xl flex items-center justify-center transition-colors"
              >
                −
              </button>
              <div className="w-20 h-16 bg-white rounded-xl border-2 border-red-200 flex items-center justify-center">
                <span className="text-3xl font-bold text-red-600">{declineQuantity}</span>
              </div>
              <button
                onClick={handleIncrement}
                disabled={declineQuantity === totalQuantity}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-bold text-xl flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Slider for larger quantities */}
          {totalQuantity > 5 && (
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max={totalQuantity}
                value={declineQuantity}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>{totalQuantity}</span>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 text-center">
              <p className="text-xs text-primary mb-1 font-medium">ACCEPTING</p>
              <p className="text-2xl font-bold text-primary">{acceptingQuantity}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-100 text-center">
              <p className="text-xs text-red-600 mb-1 font-medium">DECLINING</p>
              <p className="text-2xl font-bold text-red-700">{declineQuantity}</p>
            </div>
          </div>
        </div>

        {/* Quick Select Buttons */}
        {totalQuantity > 1 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2 text-center">Quick select:</p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setDeclineQuantity(0)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${declineQuantity === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                None
              </button>
              {totalQuantity > 2 && (
                <button
                  onClick={() => setDeclineQuantity(Math.floor(totalQuantity / 2))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${declineQuantity === Math.floor(totalQuantity / 2) ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Half ({Math.floor(totalQuantity / 2)})
                </button>
              )}
              <button
                onClick={() => setDeclineQuantity(totalQuantity)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${declineQuantity === totalQuantity ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All ({totalQuantity})
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(declineQuantity)}
            className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold shadow-lg shadow-primary/30 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};


export default DeclineModal;
