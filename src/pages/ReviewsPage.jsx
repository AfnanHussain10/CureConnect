import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getReviews } from '../services/api';
import { toast } from '../components/ui/use-toast';
import { Star, Calendar } from 'lucide-react';

function ReviewsPage() {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, positive, negative

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getReviews(token);
        setReviews(response);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reviews. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReviews();
    }
  }, [token]);

  const filteredReviews = reviews.filter(review => {
    if (filter === 'positive') return review.rating >= 4;
    if (filter === 'negative') return review.rating <= 2;
    return true;
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Patient Reviews</h1>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Reviews</option>
                <option value="positive">Positive Reviews (4-5 ★)</option>
                <option value="negative">Negative Reviews (1-2 ★)</option>
              </select>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No reviews found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{review.patientName}</h3>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-500">{review.rating} out of 5</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                  {review.appointmentId && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Appointment Date:</span>{' '}
                      {new Date(review.appointmentId.date).toLocaleDateString()}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`capitalize ${review.appointmentId.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                        {review.appointmentId.status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewsPage;