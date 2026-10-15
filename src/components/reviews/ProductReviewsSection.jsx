import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, Clock, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import { useCustomerStore } from '../../features/account/store/useCustomerStore';

export function ProductReviewsSection({
  productId,
  productName = 'this piece',
  collectionId = 'food',
  palette = {},
}) {
  const { customer, isAuthenticated, token } = useCustomerStore();

  const [aggregate, setAggregate] = useState({ averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Form State
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(customer?.name || '');
  const [orderRef, setOrderRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const fetchReviews = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reviews/product/${encodeURIComponent(productId)}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load reviews');

      setAggregate(json.aggregate || { averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
      setReviews(json.reviews || []);
      setMyReview(json.myReview || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, token]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      setSubmitError('Please provide a review of at least 5 characters.');
      return;
    }
    if (!authorName.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reviews/product/${encodeURIComponent(productId)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
          authorName: authorName.trim(),
          orderReference: orderRef.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to submit review');

      setSubmitSuccess(json.message || 'Your review has been submitted for verification.');
      setShowForm(false);
      setTitle('');
      setContent('');
      fetchReviews();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accentColor = palette.accent || palette.accentGold || '#8C6320';
  const cardBg = palette.cardBg || 'bg-white';
  const headingColor = palette.heading || 'inherit';

  return (
    <section className="mt-16 pt-12 border-t border-current/15" aria-labelledby="reviews-heading">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-75 mb-1">
              <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>Patron Experiences</span>
            </div>
            <h2 id="reviews-heading" className="text-2xl sm:text-3xl font-serif" style={{ color: headingColor }}>
              Client Reviews & Ratings
            </h2>
          </div>

          {!myReview && !showForm && (
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                if (customer?.name && !authorName) setAuthorName(customer.name);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider transition-all shadow-sm hover:opacity-90 active:scale-95 cursor-pointer text-white"
              style={{ backgroundColor: accentColor }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Write a Review</span>
            </button>
          )}
        </div>

        {/* Current Customer's Existing Submission Banner */}
        {myReview && (
          <div className="mb-8 p-4 rounded-xl border border-current/15 bg-black/5 dark:bg-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold opacity-80 flex items-center gap-1.5">
                {myReview.status === 'APPROVED' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400">Your Review is Published</span>
                  </>
                ) : myReview.status === 'REJECTED' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span className="text-rose-700 dark:text-rose-400">Review Moderation Update</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-400">Your Review is Under Moderation</span>
                  </>
                )}
              </span>
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= myReview.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                  />
                ))}
              </div>
            </div>
            {myReview.title && <p className="font-semibold text-xs sm:text-sm">{myReview.title}</p>}
            <p className="text-xs opacity-85 leading-relaxed">&ldquo;{myReview.content}&rdquo;</p>
            {myReview.status === 'PENDING' && (
              <p className="text-[11px] opacity-70 italic font-mono pt-1">
                Our concierge verifies every submission against atelier craft standards. Your rating will be added to the verified public score once approved.
              </p>
            )}
          </div>
        )}

        {submitSuccess && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{submitSuccess}</p>
              <p className="opacity-80 mt-0.5">Thank you for contributing your perspective to the Amoga archive.</p>
            </div>
          </div>
        )}

        {/* Written Review Form Modal / Accordion */}
        {showForm && (
          <form
            onSubmit={handleSubmitReview}
            className="mb-10 p-6 rounded-2xl border border-current/15 bg-black/5 dark:bg-white/5 space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-current/10">
              <h3 className="font-serif text-lg font-semibold">Share Your Experience with {productName}</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-mono opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {submitError}
              </div>
            )}

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-semibold opacity-80 mb-1.5">
                Overall Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-mono opacity-70">
                  {rating === 5
                    ? 'Exceptional'
                    : rating === 4
                    ? 'Very Good'
                    : rating === 3
                    ? 'Average'
                    : rating === 2
                    ? 'Below Expectations'
                    : 'Disappointing'}
                </span>
              </div>
            </div>

            {/* Name & Order Ref */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider font-semibold opacity-80 mb-1">
                  Your Name / Signature *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Ananya S."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-current/20 bg-white/70 dark:bg-black/30 outline-none focus:ring-1 focus:ring-current"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider font-semibold opacity-80 mb-1">
                  Order Reference (Optional)
                </label>
                <input
                  type="text"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  placeholder="e.g. AMG-2026-XXXXX"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-current/20 bg-white/70 dark:bg-black/30 outline-none focus:ring-1 focus:ring-current font-mono"
                />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-semibold opacity-80 mb-1">
                Review Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Remarkable artisanal weave, truly timeless"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-current/20 bg-white/70 dark:bg-black/30 outline-none focus:ring-1 focus:ring-current"
              />
            </div>

            {/* Review Body */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-semibold opacity-80 mb-1">
                Written Review *
              </label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe texture, flavor, craftsmanship, fit, or daily ritual experience..."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-current/20 bg-white/70 dark:bg-black/30 outline-none focus:ring-1 focus:ring-current leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                {isSubmitting ? 'Submitting Review...' : 'Submit for Moderation'}
              </button>
            </div>
          </form>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center text-xs opacity-60">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading verified patron reviews...</span>
          </div>
        ) : aggregate.totalReviews === 0 && reviews.length === 0 ? (
          /* Honest Empty State: No fabricated stars or fake reviews */
          <div className="py-12 px-6 rounded-2xl border border-current/15 bg-black/[0.02] dark:bg-white/[0.02] text-center space-y-3">
            <div className="w-12 h-12 rounded-full border border-current/20 flex items-center justify-center mx-auto opacity-60">
              <Star className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="font-serif text-lg">No Patron Reviews Yet</h3>
            <p className="text-xs opacity-75 max-w-md mx-auto leading-relaxed">
              Every Amoga review represents a genuine patron experience. Be the first to share your reflections on this artisanal curation.
            </p>
            {!myReview && !showForm && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border border-current/30 hover:border-current transition-all"
                >
                  Write the First Review
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Rating Aggregate & Reviews Grid */
          <div className="space-y-8">
            <div className="p-6 rounded-2xl border border-current/15 bg-black/[0.02] dark:bg-white/[0.02] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Score */}
              <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-current/15 pb-6 md:pb-0 md:pr-6 space-y-1">
                <div className="text-4xl sm:text-5xl font-serif font-semibold tabular-nums">
                  {aggregate.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(aggregate.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs opacity-75 font-mono">
                  Based on {aggregate.totalReviews} verified {aggregate.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Right Breakdown Bars */}
              <div className="md:col-span-8 space-y-1.5 text-xs font-mono">
                {[5, 4, 3, 2, 1].map((score) => {
                  const count = aggregate.ratingBreakdown[score] || 0;
                  const pct = aggregate.totalReviews > 0 ? (count / aggregate.totalReviews) * 100 : 0;
                  return (
                    <div key={score} className="flex items-center gap-3">
                      <span className="w-12 text-right opacity-75">{score} stars</span>
                      <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: accentColor,
                          }}
                        />
                      </div>
                      <span className="w-8 opacity-60 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Reviews List */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest font-semibold opacity-75">
                Verified Reviews ({reviews.length})
              </h3>
              <div className="divide-y divide-current/10">
                {reviews.map((rev) => (
                  <article key={rev.id} className="py-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-semibold text-sm">{rev.authorName}</span>
                        {rev.isVerifiedBuyer && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Patron</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono opacity-60">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>

                    {rev.title && <h4 className="font-medium text-xs sm:text-sm pt-0.5">{rev.title}</h4>}
                    <p className="text-xs leading-relaxed opacity-85 font-sans whitespace-pre-line">
                      {rev.content}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
