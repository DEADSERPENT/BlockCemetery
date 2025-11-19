import { useState } from 'react';
import { ethers } from 'ethers';
import { FaTimes, FaMapMarkerAlt, FaEthereum } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import { toast } from 'react-toastify';

const GraveModal = ({ grave, onClose, onReserve, reserving }) => {
  const { account } = useWeb3();
  const [metadata, setMetadata] = useState({
    deceasedName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleReserve = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (grave.reserved) {
      toast.error('This grave is already reserved');
      return;
    }

    setUploading(true);
    try {
      // In production, encrypt and upload to IPFS
      const metadataHash = `QmMock${Date.now()}_${grave.id}`;

      await onReserve(grave.id, metadataHash);
    } catch (error) {
      console.error('Error during reservation:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Grave #{grave.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                {grave.reserved ? (
                  <span className="badge badge-reserved text-lg px-4 py-2">Reserved</span>
                ) : (
                  <span className="badge badge-available text-lg px-4 py-2">Available</span>
                )}
                {grave.maintained && (
                  <span className="badge badge-maintained text-lg px-4 py-2 ml-2">
                    Maintained
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Price</div>
                <div className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaEthereum className="mr-1" />
                  {ethers.formatEther(grave.price)} ETH
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <DetailRow label="Graveyard ID" value={grave.graveyardId} />
            <DetailRow label="Owner" value={grave.reserved ? grave.owner : 'Not Reserved'} />
            {grave.locationHash && (
              <DetailRow label="Location Hash" value={grave.locationHash} />
            )}
            {grave.timestamp !== '0' && (
              <DetailRow
                label="Reserved On"
                value={new Date(Number(grave.timestamp) * 1000).toLocaleDateString()}
              />
            )}
          </div>

          {/* Reservation Form (only if not reserved) */}
          {!grave.reserved && account && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reservation Details (Optional)
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deceased Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={metadata.deceasedName}
                    onChange={(e) =>
                      setMetadata({ ...metadata, deceasedName: e.target.value })
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={metadata.dateOfBirth}
                      onChange={(e) =>
                        setMetadata({ ...metadata, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Death
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={metadata.dateOfDeath}
                      onChange={(e) =>
                        setMetadata({ ...metadata, dateOfDeath: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="input"
                    rows="3"
                    value={metadata.notes}
                    onChange={(e) =>
                      setMetadata({ ...metadata, notes: e.target.value })
                    }
                    placeholder="Any additional information"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The reservation details will be encrypted and stored
                  off-chain. Only you will have access to this information.
                </p>
              </div>

              <button
                onClick={handleReserve}
                disabled={reserving || uploading}
                className="w-full btn btn-primary text-lg py-3"
              >
                {reserving || uploading
                  ? 'Processing...'
                  : `Reserve Grave for ${ethers.formatEther(grave.price)} ETH`}
              </button>
            </div>
          )}

          {/* Already Reserved Message */}
          {grave.reserved && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                This grave has already been reserved and is not available for purchase.
              </p>
            </div>
          )}

          {/* Not Connected Message */}
          {!grave.reserved && !account && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Please connect your wallet to reserve this grave.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}:</span>
    <span className="font-medium text-gray-900 text-right break-all max-w-md">
      {value}
    </span>
  </div>
);

export default GraveModal;
