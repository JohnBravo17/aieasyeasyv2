import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Images, 
  Video, 
  Download, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  Home
} from 'lucide-react';

const UserGallery = ({ onNavigateHome }) => {
  const { userService, user } = useAuth();
  const [generations, setGenerations] = useState([]);
  const [filteredGenerations, setFilteredGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'image', 'video'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'cost'
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  useEffect(() => {
    if (userService && user) {
      loadGenerations();
    }
  }, [userService, user]);

  useEffect(() => {
    // Apply filters and search
    let filtered = [...generations];

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(gen => gen.type === filter);
    }

    // Search in prompts
    if (searchTerm) {
      filtered = filtered.filter(gen => 
        gen.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'cost':
          return (b.customerCharge || 0) - (a.customerCharge || 0);
        default:
          return 0;
      }
    });

    setFilteredGenerations(filtered);
  }, [generations, filter, searchTerm, sortBy]);

  const loadGenerations = async () => {
    try {
      setLoading(true);
      const userGenerations = await userService.getUserGenerations(100);
      setGenerations(userGenerations);
      console.log(`📁 Loaded ${userGenerations.length} generations`);
    } catch (error) {
      console.error('Error loading generations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount || 0);
  };

  const handleDownload = async (generation) => {
    try {
      const response = await fetch(generation.outputURL);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = generation.type === 'video' ? 'mp4' : 'png';
      const timestamp = new Date(generation.createdAt).toISOString().split('T')[0];
      link.download = `aieasyeasy_${generation.type}_${timestamp}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('💾 Downloaded:', generation.id);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const getTotalStats = () => {
    const totalSpent = generations.reduce((sum, gen) => sum + (gen.customerCharge || 0), 0);
    const imageCount = generations.filter(gen => gen.type === 'image').length;
    const videoCount = generations.filter(gen => gen.type === 'video').length;
    
    return { totalSpent, imageCount, videoCount, total: generations.length };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading your gallery...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Gallery</h1>
          <p className="text-gray-400 mt-2">Your personal AI generation history</p>
        </div>
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Home size={20} />
              Back to Home
            </button>
          )}
          <button
            onClick={loadGenerations}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Generations</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
            <Images className="text-blue-500" size={20} />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Images</p>
              <p className="text-xl font-bold text-white">{stats.imageCount}</p>
            </div>
            <Images className="text-green-500" size={20} />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Videos</p>
              <p className="text-xl font-bold text-white">{stats.videoCount}</p>
            </div>
            <Video className="text-purple-500" size={20} />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Spent</p>
              <p className="text-xl font-bold text-white">{formatCurrency(stats.totalSpent)}</p>
            </div>
            <DollarSign className="text-yellow-500" size={20} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="all">All Types</option>
              <option value="image">Images Only</option>
              <option value="video">Videos Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="cost">Highest Cost</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 w-64"
          />
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredGenerations.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-gray-400 mb-4">
            {generations.length === 0 ? (
              <Images size={48} className="mx-auto mb-4" />
            ) : (
              <Search size={48} className="mx-auto mb-4" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {generations.length === 0 ? 'No Generations Yet' : 'No Results Found'}
          </h3>
          <p className="text-gray-400">
            {generations.length === 0 
              ? 'Start generating images and videos to build your gallery!'
              : 'Try adjusting your filters or search terms.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGenerations.map((generation) => (
            <div
              key={generation.id}
              className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors"
            >
              {/* Media Preview */}
              <div className="aspect-square bg-gray-900 relative group">
                {generation.type === 'image' ? (
                  <img
                    src={generation.outputURL}
                    alt={generation.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={generation.outputURL}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => e.target.pause()}
                  />
                )}
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedGeneration(generation)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(generation)}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Download size={16} />
                  </button>
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    generation.type === 'image' 
                      ? 'bg-green-600 text-green-100'
                      : 'bg-purple-600 text-purple-100'
                  }`}>
                    {generation.type === 'image' ? <Images size={12} /> : <Video size={12} />}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                  {generation.prompt || 'No prompt'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{generation.model}</span>
                  <span>{formatCurrency(generation.customerCharge)}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>{formatDate(generation.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for full view */}
      {selectedGeneration && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Generation Details</h3>
                <button
                  onClick={() => setSelectedGeneration(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {selectedGeneration.type === 'image' ? (
                    <img
                      src={selectedGeneration.outputURL}
                      alt={selectedGeneration.prompt}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <video
                      src={selectedGeneration.outputURL}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">Prompt</label>
                    <p className="text-white">{selectedGeneration.prompt}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Model</label>
                      <p className="text-white">{selectedGeneration.model}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Type</label>
                      <p className="text-white capitalize">{selectedGeneration.type}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Cost</label>
                      <p className="text-white">{formatCurrency(selectedGeneration.customerCharge)}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Created</label>
                      <p className="text-white">{formatDate(selectedGeneration.createdAt)}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(selectedGeneration)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGallery;