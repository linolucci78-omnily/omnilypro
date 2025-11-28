import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Submit Review Edge Function
 *
 * Handles:
 * 1. GET: Returns review form HTML
 * 2. POST: Submits review and awards bonus points
 */

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const orgId = url.searchParams.get('org')
    const customerId = url.searchParams.get('customer')
    const transactionId = url.searchParams.get('transaction')

    if (!orgId || !customerId) {
      return new Response('Missing required parameters', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // GET: Return review form HTML
    if (req.method === 'GET') {
      // Fetch organization details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('name, primary_color, logo_url, website')
        .eq('id', orgId)
        .single()

      if (orgError || !org) {
        return new Response('Organization not found', {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        })
      }

      // Fetch customer details
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single()

      if (customerError || !customer) {
        return new Response('Customer not found', {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        })
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('customer_reviews')
        .select('id, rating, comment, created_at')
        .eq('organization_id', orgId)
        .eq('customer_id', customerId)
        .eq('transaction_id', transactionId)
        .single()

      const primaryColor = org.primary_color || '#dc2626'

      // If review already exists, show thank you message
      if (existingReview) {
        return new Response(generateThankYouHTML(org.name, primaryColor, existingReview), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        })
      }

      // Return review form HTML
      return new Response(
        generateReviewFormHTML(org.name, customer.name, primaryColor, orgId, customerId, transactionId),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }

    // POST: Submit review
    if (req.method === 'POST') {
      const body = await req.json()
      const { rating, comment, platform } = body

      if (!rating || rating < 1 || rating > 5) {
        return new Response(
          JSON.stringify({ error: 'Invalid rating' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get organization settings for bonus points
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('review_request_bonus_points, name')
        .eq('id', orgId)
        .single()

      if (orgError || !org) {
        return new Response(
          JSON.stringify({ error: 'Organization not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const bonusPoints = org.review_request_bonus_points || 50

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('customer_reviews')
        .select('id')
        .eq('organization_id', orgId)
        .eq('customer_id', customerId)
        .eq('transaction_id', transactionId)
        .single()

      if (existingReview) {
        return new Response(
          JSON.stringify({ error: 'Review already submitted' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert review
      const { data: review, error: reviewError } = await supabase
        .from('customer_reviews')
        .insert({
          organization_id: orgId,
          customer_id: customerId,
          transaction_id: transactionId,
          rating,
          comment: comment || null,
          platform: platform || 'internal',
          is_public: true,
          bonus_points_awarded: bonusPoints
        })
        .select()
        .single()

      if (reviewError) {
        console.error('Error inserting review:', reviewError)
        return new Response(
          JSON.stringify({ error: 'Failed to submit review' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get customer current points
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('points')
        .eq('id', customerId)
        .single()

      if (!customerError && customer) {
        // Award bonus points
        await supabase
          .from('customers')
          .update({
            points: customer.points + bonusPoints
          })
          .eq('id', customerId)

        // Log activity
        await supabase
          .from('customer_activities')
          .insert({
            customer_id: customerId,
            organization_id: orgId,
            type: 'points_added',
            description: `⭐ Bonus recensione: +${bonusPoints} punti`,
            points: bonusPoints,
            metadata: {
              reason: 'review_bonus',
              review_id: review.id,
              rating
            }
          })
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Review submitted successfully',
          bonus_points: bonusPoints
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error in submit-review function:', errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateReviewFormHTML(
  storeName: string,
  customerName: string,
  primaryColor: string,
  orgId: string,
  customerId: string,
  transactionId: string | null
): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⭐ Lascia una Recensione - ${storeName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, ${primaryColor}15 0%, #ffffff 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      padding: 48px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .emoji {
      font-size: 64px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 32px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 16px;
    }
    .greeting {
      font-size: 18px;
      color: #4b5563;
      margin-bottom: 32px;
      text-align: center;
    }
    .stars-container {
      text-align: center;
      margin: 40px 0;
    }
    .stars-label {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .stars {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .star {
      font-size: 48px;
      cursor: pointer;
      transition: transform 0.2s, filter 0.2s;
      filter: grayscale(100%);
      opacity: 0.3;
    }
    .star.active {
      filter: grayscale(0%);
      opacity: 1;
      transform: scale(1.1);
    }
    .star:hover {
      transform: scale(1.15);
    }
    .rating-text {
      color: #6b7280;
      font-size: 14px;
      margin-top: 8px;
    }
    .form-group {
      margin: 24px 0;
    }
    label {
      display: block;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
      font-size: 14px;
    }
    textarea {
      width: 100%;
      padding: 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      font-family: inherit;
      resize: vertical;
      min-height: 120px;
      transition: border-color 0.3s;
    }
    textarea:focus {
      outline: none;
      border-color: ${primaryColor};
    }
    .submit-btn {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, ${primaryColor} 0%, #ef4444 100%);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 8px 24px ${primaryColor}40;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px ${primaryColor}60;
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .bonus-badge {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 3px solid #f59e0b;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .bonus-badge .icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .bonus-badge .points {
      font-size: 28px;
      font-weight: 800;
      color: #b45309;
    }
    .bonus-badge .text {
      color: #78350f;
      font-size: 14px;
      margin-top: 4px;
    }
    .error {
      background: #fee;
      color: #c00;
      padding: 12px;
      border-radius: 8px;
      margin: 16px 0;
      display: none;
    }
    .success {
      text-align: center;
      padding: 40px 0;
    }
    .success .check {
      font-size: 64px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">⭐</div>
      <h1>Lascia una Recensione</h1>
      <p class="subtitle">${storeName}</p>
    </div>

    <div class="greeting">
      Ciao <strong>${customerName}</strong>!<br>
      Come è stata la tua esperienza?
    </div>

    <form id="reviewForm">
      <div class="stars-container">
        <div class="stars-label">Valuta la tua esperienza</div>
        <div class="stars" id="starsContainer">
          <span class="star" data-rating="1">⭐</span>
          <span class="star" data-rating="2">⭐</span>
          <span class="star" data-rating="3">⭐</span>
          <span class="star" data-rating="4">⭐</span>
          <span class="star" data-rating="5">⭐</span>
        </div>
        <div class="rating-text" id="ratingText">Seleziona un voto</div>
      </div>

      <div class="form-group">
        <label for="comment">Il tuo feedback (opzionale)</label>
        <textarea
          id="comment"
          name="comment"
          placeholder="Raccontaci la tua esperienza..."
        ></textarea>
      </div>

      <div class="bonus-badge">
        <div class="icon">🎁</div>
        <div class="points">+50 PUNTI</div>
        <div class="text">Ricevi immediatamente punti bonus per la tua recensione!</div>
      </div>

      <div class="error" id="error"></div>

      <button type="submit" class="submit-btn" id="submitBtn" disabled>
        Invia Recensione
      </button>
    </form>
  </div>

  <script>
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('reviewForm');
    const errorDiv = document.getElementById('error');
    let selectedRating = 0;

    const ratingTexts = {
      1: '😞 Pessima',
      2: '😕 Scarsa',
      3: '😐 Sufficiente',
      4: '😊 Buona',
      5: '🤩 Eccellente'
    };

    stars.forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        updateStars();
        submitBtn.disabled = false;
      });

      star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        highlightStars(rating);
      });
    });

    document.getElementById('starsContainer').addEventListener('mouseleave', () => {
      updateStars();
    });

    function highlightStars(rating) {
      stars.forEach((star, index) => {
        if (index < rating) {
          star.classList.add('active');
        } else {
          star.classList.remove('active');
        }
      });
      ratingText.textContent = ratingTexts[rating] || 'Seleziona un voto';
    }

    function updateStars() {
      highlightStars(selectedRating);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (selectedRating === 0) {
        showError('Seleziona un voto prima di inviare');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso...';

      try {
        const response = await fetch(window.location.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: selectedRating,
            comment: document.getElementById('comment').value,
            platform: 'internal'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Errore durante l\\'invio');
        }

        // Show success
        document.querySelector('.container').innerHTML = \`
          <div class="success">
            <div class="check">✅</div>
            <h1 style="margin-bottom: 16px;">Grazie!</h1>
            <p style="color: #6b7280; font-size: 18px; margin-bottom: 24px;">
              La tua recensione è stata inviata con successo!
            </p>
            <div class="bonus-badge">
              <div class="icon">🎉</div>
              <div class="points">+\${data.bonus_points} PUNTI</div>
              <div class="text">I punti bonus sono stati aggiunti al tuo account!</div>
            </div>
          </div>
        \`;
      } catch (error) {
        showError(error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Invia Recensione';
      }
    });

    function showError(message) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  </script>
</body>
</html>`
}

function generateThankYouHTML(storeName: string, primaryColor: string, review: any): string {
  const ratingStars = '⭐'.repeat(review.rating)

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grazie - ${storeName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, ${primaryColor}15 0%, #ffffff 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      padding: 48px;
      text-align: center;
    }
    .check { font-size: 80px; margin-bottom: 24px; }
    h1 { font-size: 36px; color: #1f2937; margin-bottom: 16px; }
    .subtitle { color: #6b7280; font-size: 18px; margin-bottom: 32px; }
    .review-box {
      background: #f9fafb;
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    }
    .stars { font-size: 32px; margin-bottom: 16px; }
    .date { color: #9ca3af; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="check">✅</div>
    <h1>Recensione Già Inviata</h1>
    <p class="subtitle">Hai già lasciato una recensione per questo acquisto</p>

    <div class="review-box">
      <div class="stars">${ratingStars}</div>
      ${review.comment ? `<p style="color: #4b5563; margin-top: 12px;">"${review.comment}"</p>` : ''}
      <p class="date">Inviata il ${new Date(review.created_at).toLocaleDateString('it-IT')}</p>
    </div>

    <p style="color: #6b7280; margin-top: 24px;">
      Grazie per il tuo prezioso feedback! ❤️
    </p>
  </div>
</body>
</html>`
}
