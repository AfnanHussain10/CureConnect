import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getReviews } from '../../services/api';
import { Star } from 'lucide-react';

const ReviewsTab = () => {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await getReviews(token);
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-gray-900">{review.patientName || 'Anonymous'}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex">{renderStars(review.rating)}</div>
            </div>
            <p className="text-gray-700">{review.comment}</p>
            {review.appointmentDetails && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Appointment: {review.appointmentDetails}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsTab;