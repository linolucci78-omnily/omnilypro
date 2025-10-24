// Full RestaurantClassic template CSS
export const RESTAURANT_CLASSIC_CSS = `/* Restaurant Classic Template - Professional Design */

/* Import Google Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Force full width - override any parent styles */
html {
  overflow-x: hidden !important;
  width: 100% !important;
  scroll-behavior: smooth;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  color: #1a1a1a;
  line-height: 1.6;
}

* {
  box-sizing: border-box !important;
  max-width: 100%;
}

img {
  max-width: 100% !important;
  height: auto;
}

/* Hero Section - Fullscreen */
.hero-section {
  position: relative;
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  overflow: hidden !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  width: 90%;
  padding: 2rem;
  animation: fadeInUp 1s ease-out;
  box-sizing: border-box;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.hero-subtitle {
  font-size: clamp(1.25rem, 3vw, 2rem);
  font-weight: 300;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.hero-cta {
  display: inline-block;
  padding: 1rem 3rem;
  background: white;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.125rem;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.hero-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  background: #f8f8f8;
}

/* About Section */
.about-section {
  padding: 6rem 0;
  background: white;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  margin: 0;
}

.about-content {
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
  width: 100%;
  max-width: 1000px;
  box-sizing: border-box;
}

.about-description {
  font-size: 1.25rem;
  line-height: 1.8;
  color: #555;
  margin-bottom: 2rem;
}

/* Section Title */
.section-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #2c3e50;
  position: relative;
}

.section-title::after {
  content: '';
  display: block;
  width: 80px;
  height: 4px;
  background: #667eea;
  margin: 1rem auto 0;
  border-radius: 2px;
}

/* Services Grid */
.services-section {
  padding: 6rem 0;
  background: #f8f9fa;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  margin: 0;
}

.services-grid {
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  width: 100%;
  max-width: 1400px;
  box-sizing: border-box;
  justify-content: center;
}

.service-card {
  flex: 1 1 calc(33.333% - 2rem);
  min-width: 280px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  padding: 2rem;
  text-align: center;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.service-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.service-description {
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
}

/* Footer */
.footer {
  background: #1a1a1a;
  color: white;
  padding: 2rem;
  text-align: center;
}

.footer p {
  margin: 0;
  opacity: 0.8;
  font-size: 0.95rem;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-section {
    height: 80vh;
    min-height: 500px;
  }

  .services-grid {
    gap: 1rem;
  }

  .service-card {
    flex: 1 1 100%;
  }
}
`;
