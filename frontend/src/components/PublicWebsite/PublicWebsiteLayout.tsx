import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { OrganizationWebsite } from '../../services/websiteService'
import { NavbarPremium } from './sections/NavbarPremium'
import { HeroSectionPremium } from './sections/HeroSectionPremium'
import { AboutSectionPremium } from './sections/AboutSectionPremium'
import { LoyaltySectionPremium } from './sections/LoyaltySectionPremium'
import { ServicesSectionPremium } from './sections/ServicesSectionPremium'
import { GallerySectionPremium } from './sections/GallerySectionPremium'
import { TestimonialsSectionPremium } from './sections/TestimonialsSectionPremium'
import { ContactSectionPremium } from './sections/ContactSectionPremium'
import { TeamSection } from './sections/TeamSection'
import { VideoSection } from './sections/VideoSection'
import { CustomSectionPremium } from './sections/CustomSectionPremium'
import { PriceListSectionPremium } from './sections/PriceListSectionPremium'
import { GDPRBanner } from './GDPRBanner'

interface PublicWebsiteLayoutProps {
  organization: OrganizationWebsite
  featuredRewards?: any[]
  onSubmitContact?: (data: any) => Promise<void>
}

export const PublicWebsiteLayout: React.FC<PublicWebsiteLayoutProps> = ({
  organization,
  featuredRewards = [],
  onSubmitContact,
}) => {
  const { websiteConfig } = organization

  // Google Analytics
  useEffect(() => {
    if (websiteConfig.website_google_analytics_id) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${websiteConfig.website_google_analytics_id}`
      document.head.appendChild(script)

      const inlineScript = document.createElement('script')
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${websiteConfig.website_google_analytics_id}');
      `
      document.head.appendChild(inlineScript)
    }
  }, [websiteConfig.website_google_analytics_id])

  // Google Tag Manager
  useEffect(() => {
    if (websiteConfig.website_google_tag_manager_id) {
      const script = document.createElement('script')
      script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${websiteConfig.website_google_tag_manager_id}');
      `
      document.head.appendChild(script)
    }
  }, [websiteConfig.website_google_tag_manager_id])

  // Facebook Pixel
  useEffect(() => {
    if (websiteConfig.website_facebook_pixel_id) {
      const script = document.createElement('script')
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${websiteConfig.website_facebook_pixel_id}');
        fbq('track', 'PageView');
      `
      document.head.appendChild(script)
    }
  }, [websiteConfig.website_facebook_pixel_id])

  const metaTitle = websiteConfig.website_meta_title || `${organization.name} - ${organization.tagline || 'Programma Fedeltà'}`
  const metaDescription = websiteConfig.website_meta_description || organization.websiteConfig.website_description || `Scopri ${organization.name} e il nostro esclusivo programma fedeltà. Accumula punti ad ogni acquisto e ricevi premi straordinari!`
  const ogImage = websiteConfig.website_og_image || organization.logo_url || organization.websiteConfig.website_hero_image

  const fullAddress = [organization.address, organization.city, organization.postal_code]
    .filter(Boolean)
    .join(', ')

  // Schema.org structured data for SEO
  const schemaOrgData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: organization.name,
    description: metaDescription,
    url: window.location.href,
    logo: organization.logo_url,
    image: ogImage,
    ...(organization.phone && { telephone: organization.phone }),
    ...(organization.email && { email: organization.email }),
    ...(fullAddress && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: organization.address,
        addressLocality: organization.city,
        postalCode: organization.postal_code,
      },
    }),
    ...(websiteConfig.website_opening_hours && {
      openingHours: Object.entries(websiteConfig.website_opening_hours)
        .filter(([_, hours]) => !hours.closed)
        .map(([day, hours]) => {
          const dayMap: { [key: string]: string } = {
            monday: 'Mo',
            tuesday: 'Tu',
            wednesday: 'We',
            thursday: 'Th',
            friday: 'Fr',
            saturday: 'Sa',
            sunday: 'Su',
          }
          return `${dayMap[day]} ${hours.open}-${hours.close}`
        }),
    }),
  }

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        {websiteConfig.website_meta_keywords && (
          <meta name="keywords" content={websiteConfig.website_meta_keywords} />
        )}

        {/* Google Fonts */}
        {websiteConfig.website_font_headings && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${websiteConfig.website_font_headings.replace(' ', '+')}:wght@300;400;600;700;800;900&display=swap`}
            rel="stylesheet"
          />
        )}
        {websiteConfig.website_font_body && websiteConfig.website_font_body !== websiteConfig.website_font_headings && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${websiteConfig.website_font_body.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`}
            rel="stylesheet"
          />
        )}

        {/* Global Typography & Color Styles */}
        <style>{`
          :root {
            --website-font-headings: '${websiteConfig.website_font_headings || 'Inter'}', sans-serif;
            --website-font-body: '${websiteConfig.website_font_body || 'Inter'}', sans-serif;
            --website-color-text-primary: ${websiteConfig.website_color_text_primary || '#1f2937'};
            --website-color-text-secondary: ${websiteConfig.website_color_text_secondary || '#6b7280'};
            --website-color-bg-primary: ${websiteConfig.website_color_background_primary || '#ffffff'};
            --website-color-bg-secondary: ${websiteConfig.website_color_background_secondary || '#f9fafb'};
            --website-button-bg: ${websiteConfig.website_button_bg_color || organization.primary_color};
            --website-button-text: ${websiteConfig.website_button_text_color || '#ffffff'};
            --website-button-border-radius: ${websiteConfig.website_button_border_radius || '8px'};
            --website-button-border-width: ${websiteConfig.website_button_border_width || '0px'};
            --website-button-border-color: ${websiteConfig.website_button_border_color || organization.primary_color};
            --website-button-hover-bg: ${websiteConfig.website_button_hover_bg_color || '#dc2626'};
            --website-button-hover-text: ${websiteConfig.website_button_hover_text_color || '#ffffff'};
            --website-button-padding: ${websiteConfig.website_button_padding || '12px 24px'};
            --website-button-font-weight: ${websiteConfig.website_button_font_weight || '600'};
          }

          body {
            font-family: var(--website-font-body);
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--website-font-headings);
          }

          /* Modern Button Styles - Outline Style */
          button:not([class*="skip"]):not([class*="ignore"]),
          a.button,
          .btn {
            background: ${organization.primary_color}50 !important;
            color: ${websiteConfig.website_button_text_color || organization.primary_color} !important;
            border-radius: ${websiteConfig.website_button_border_radius || '12px'} !important;
            border: 3px solid ${websiteConfig.website_button_border_color || organization.primary_color} !important;
            padding: ${websiteConfig.website_button_padding || '14px 32px'} !important;
            font-weight: ${websiteConfig.website_button_font_weight || '700'} !important;
            font-family: var(--website-font-body) !important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            cursor: pointer !important;
            position: relative !important;
            overflow: hidden !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
          }

          button:not([class*="skip"]):not([class*="ignore"]):hover,
          a.button:hover,
          .btn:hover {
            background: ${websiteConfig.website_button_hover_bg_color || organization.primary_color} !important;
            color: ${websiteConfig.website_button_hover_text_color || '#ffffff'} !important;
            transform: translateY(-3px) scale(1.02) !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
            border-color: ${websiteConfig.website_button_hover_bg_color || organization.primary_color} !important;
          }

          button:not([class*="skip"]):not([class*="ignore"]):active,
          a.button:active,
          .btn:active {
            transform: translateY(-1px) scale(0.98) !important;
            transition: all 0.1s ease !important;
          }

          /* Modern Input Styles - Clean White */
          input[type="text"],
          input[type="email"],
          input[type="tel"],
          input[type="number"],
          input[type="password"],
          input[type="search"],
          input[type="url"],
          textarea,
          select {
            background: #ffffff !important;
            color: #1f2937 !important;
            border: 2px solid #e5e7eb !important;
            border-radius: 12px !important;
            padding: 12px 16px !important;
            font-family: var(--website-font-body) !important;
            font-size: 15px !important;
            transition: all 0.3s ease !important;
            outline: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
          }

          input[type="text"]::placeholder,
          input[type="email"]::placeholder,
          input[type="tel"]::placeholder,
          input[type="number"]::placeholder,
          input[type="password"]::placeholder,
          input[type="search"]::placeholder,
          input[type="url"]::placeholder,
          textarea::placeholder {
            color: #9ca3af !important;
            opacity: 1 !important;
          }

          input[type="text"]:focus,
          input[type="email"]:focus,
          input[type="tel"]:focus,
          input[type="number"]:focus,
          input[type="password"]:focus,
          input[type="search"]:focus,
          input[type="url"]:focus,
          textarea:focus,
          select:focus {
            border-color: ${organization.primary_color} !important;
            box-shadow: 0 0 0 3px ${organization.primary_color}20, 0 1px 3px rgba(0, 0, 0, 0.05) !important;
            background: #ffffff !important;
          }

          input[type="text"]:hover,
          input[type="email"]:hover,
          input[type="tel"]:hover,
          input[type="number"]:hover,
          input[type="password"]:hover,
          input[type="search"]:hover,
          input[type="url"]:hover,
          textarea:hover,
          select:hover {
            border-color: #d1d5db !important;
          }
        `}</style>

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={window.location.href} />
        {ogImage && <meta property="og:image" content={ogImage} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* Favicon */}
        {websiteConfig.website_favicon_url && (
          <link rel="icon" href={websiteConfig.website_favicon_url} />
        )}

        {/* Schema.org */}
        <script type="application/ld+json">{JSON.stringify(schemaOrgData)}</script>

        {/* Custom CSS */}
        {websiteConfig.website_custom_css && (
          <style>{websiteConfig.website_custom_css}</style>
        )}
      </Helmet>

      {/* Google Tag Manager (noscript) */}
      {websiteConfig.website_google_tag_manager_id && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${websiteConfig.website_google_tag_manager_id}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
      )}

      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <NavbarPremium
          name={organization.name}
          logo={organization.logo_url}
          primaryColor={organization.primary_color}
          email={organization.email}
          phone={organization.phone}
          showAbout={websiteConfig.website_show_about}
          showServices={websiteConfig.website_show_services}
          showGallery={websiteConfig.website_show_gallery}
          showLoyalty={websiteConfig.website_show_loyalty}
          showTestimonials={websiteConfig.website_show_testimonials}
          showPricing={websiteConfig.website_show_pricing}
          showTeam={websiteConfig.website_show_team}
          showVideo={websiteConfig.website_show_video}
          customSections={websiteConfig.website_custom_sections || []}
          showPoweredBy={websiteConfig.website_show_powered_by ?? true}
        />

        {/* Hero */}
        {websiteConfig.website_show_hero && (() => {
          const heroName = websiteConfig.website_hero_title_override || organization.name;
          const heroTagline = websiteConfig.website_hero_subtitle_override || organization.tagline;
          return (
            <HeroSectionPremium
              name={heroName}
              tagline={heroTagline}
              subtitle={websiteConfig.website_hero_subtitle}
            heroImage={websiteConfig.website_hero_image}
            primaryColor={organization.primary_color}
            logo={organization.logo_url}
            enableParallax={websiteConfig.website_hero_enable_parallax}
            enableParticles={websiteConfig.website_hero_enable_particles}
            bgType={websiteConfig.website_hero_bg_type}
            bgColor={websiteConfig.website_hero_bg_color}
            bgGradientStart={websiteConfig.website_hero_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_hero_bg_gradient_end}
            overlayColor={websiteConfig.website_hero_overlay_color}
            overlayOpacity={websiteConfig.website_hero_overlay_opacity}
          />
          );
        })()}

        {/* About */}
        {websiteConfig.website_show_about && (
          <AboutSectionPremium
            name={organization.name}
            description={websiteConfig.website_description}
            industry={organization.industry}
            primaryColor={organization.primary_color}
            bgType={websiteConfig.website_about_bg_type}
            bgColor={websiteConfig.website_about_bg_color}
            bgGradientStart={websiteConfig.website_about_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_about_bg_gradient_end}
            bgImage={websiteConfig.website_about_bg_image}
            enableParallax={websiteConfig.website_about_enable_parallax}
            enableOverlay={websiteConfig.website_about_enable_overlay}
            overlayColor={websiteConfig.website_about_overlay_color}
            overlayOpacity={websiteConfig.website_about_overlay_opacity}
            textColor={websiteConfig.website_about_text_color}
            stat1Value={websiteConfig.website_about_stat1_value}
            stat1Label={websiteConfig.website_about_stat1_label}
            stat2Value={websiteConfig.website_about_stat2_value}
            stat2Label={websiteConfig.website_about_stat2_label}
            stat3Value={websiteConfig.website_about_stat3_value}
            stat3Label={websiteConfig.website_about_stat3_label}
            stat4Value={websiteConfig.website_about_stat4_value}
            stat4Label={websiteConfig.website_about_stat4_label}
          />
        )}

        {/* Services */}
        {websiteConfig.website_show_services && websiteConfig.website_services && (
          <ServicesSectionPremium
            services={websiteConfig.website_services}
            primaryColor={organization.primary_color}
            bgType={websiteConfig.website_services_bg_type}
            bgColor={websiteConfig.website_services_bg_color}
            bgGradientStart={websiteConfig.website_services_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_services_bg_gradient_end}
            bgImage={websiteConfig.website_services_bg_image}
            enableParallax={websiteConfig.website_services_enable_parallax}
            enableOverlay={websiteConfig.website_services_enable_overlay}
            overlayColor={websiteConfig.website_services_overlay_color}
            overlayOpacity={websiteConfig.website_services_overlay_opacity}
            textColor={websiteConfig.website_services_text_color}
          />
        )}

        {/* Gallery */}
        {websiteConfig.website_show_gallery && websiteConfig.website_gallery && (
          <GallerySectionPremium
            gallery={websiteConfig.website_gallery}
            primaryColor={organization.primary_color}
            layout={websiteConfig.website_gallery_layout}
            enableLightbox={websiteConfig.website_gallery_enable_lightbox}
            enableZoom={websiteConfig.website_gallery_enable_zoom}
            enableCaptions={websiteConfig.website_gallery_enable_captions}
            bgType={websiteConfig.website_gallery_bg_type}
            bgColor={websiteConfig.website_gallery_bg_color}
            bgGradientStart={websiteConfig.website_gallery_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_gallery_bg_gradient_end}
            bgImage={websiteConfig.website_gallery_bg_image}
            enableParallax={websiteConfig.website_gallery_enable_parallax}
            enableOverlay={websiteConfig.website_gallery_enable_overlay}
            overlayColor={websiteConfig.website_gallery_overlay_color}
            overlayOpacity={websiteConfig.website_gallery_overlay_opacity}
          />
        )}

        {/* Loyalty */}
        {websiteConfig.website_show_loyalty && (
          <LoyaltySectionPremium
            pointsName={organization.points_name}
            pointsPerEuro={organization.points_per_euro}
            rewardThreshold={organization.reward_threshold}
            welcomeBonus={organization.welcome_bonus}
            primaryColor={organization.primary_color}
            secondaryColor={organization.secondary_color}
            featuredRewards={featuredRewards}
            bgType={websiteConfig.website_loyalty_bg_type}
            bgColor={websiteConfig.website_loyalty_bg_color}
            bgGradientStart={websiteConfig.website_loyalty_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_loyalty_bg_gradient_end}
            bgImage={websiteConfig.website_loyalty_bg_image}
            enableParallax={websiteConfig.website_loyalty_enable_parallax}
            enableOverlay={websiteConfig.website_loyalty_enable_overlay}
            overlayColor={websiteConfig.website_loyalty_overlay_color}
            overlayOpacity={websiteConfig.website_loyalty_overlay_opacity}
            textColor={websiteConfig.website_loyalty_text_color}
          />
        )}

        {/* Testimonials */}
        {websiteConfig.website_show_testimonials && websiteConfig.website_testimonials && (
          <TestimonialsSectionPremium
            testimonials={websiteConfig.website_testimonials}
            primaryColor={organization.primary_color}
            bgType={websiteConfig.website_testimonials_bg_type}
            bgColor={websiteConfig.website_testimonials_bg_color}
            bgGradientStart={websiteConfig.website_testimonials_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_testimonials_bg_gradient_end}
            bgImage={websiteConfig.website_testimonials_bg_image}
            enableParallax={websiteConfig.website_testimonials_enable_parallax}
            enableOverlay={websiteConfig.website_testimonials_enable_overlay}
            overlayColor={websiteConfig.website_testimonials_overlay_color}
            overlayOpacity={websiteConfig.website_testimonials_overlay_opacity}
            textColor={websiteConfig.website_testimonials_text_color}
          />
        )}

        {/* Pricing - Price List with Categories */}
        {websiteConfig.website_show_pricing &&
         websiteConfig.website_price_list_categories &&
         websiteConfig.website_price_list_categories.length > 0 && (
          <PriceListSectionPremium
            categories={websiteConfig.website_price_list_categories}
            primaryColor={organization.primary_color}
            title={websiteConfig.website_pricing_title}
            subtitle={websiteConfig.website_pricing_subtitle}
            layout={websiteConfig.website_pricing_layout as 'vertical' | 'horizontal'}
            bgType={websiteConfig.website_pricing_bg_type}
            bgColor={websiteConfig.website_pricing_bg_color}
            bgGradientStart={websiteConfig.website_pricing_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_pricing_bg_gradient_end}
            bgImage={websiteConfig.website_pricing_bg_image}
            enableParallax={websiteConfig.website_pricing_enable_parallax}
            enableOverlay={websiteConfig.website_pricing_enable_overlay}
            overlayColor={websiteConfig.website_pricing_overlay_color}
            overlayOpacity={websiteConfig.website_pricing_overlay_opacity}
            textColor={websiteConfig.website_pricing_text_color}
          />
        )}

        {/* Team */}
        {websiteConfig.website_show_team && websiteConfig.website_team && (
          <TeamSection
            team={websiteConfig.website_team}
            primaryColor={organization.primary_color}
            bgType={websiteConfig.website_team_bg_type}
            bgColor={websiteConfig.website_team_bg_color}
            bgGradientStart={websiteConfig.website_team_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_team_bg_gradient_end}
            bgImage={websiteConfig.website_team_bg_image}
            enableParallax={websiteConfig.website_team_enable_parallax}
            enableOverlay={websiteConfig.website_team_enable_overlay}
            overlayColor={websiteConfig.website_team_overlay_color}
            overlayOpacity={websiteConfig.website_team_overlay_opacity}
            textColor={websiteConfig.website_team_text_color}
          />
        )}

        {/* Video */}
        {websiteConfig.website_show_video && websiteConfig.website_video_url && (
          <VideoSection
            videoUrl={websiteConfig.website_video_url}
            primaryColor={organization.primary_color}
            bgType={websiteConfig.website_video_bg_type}
            bgColor={websiteConfig.website_video_bg_color}
            bgGradientStart={websiteConfig.website_video_bg_gradient_start}
            bgGradientEnd={websiteConfig.website_video_bg_gradient_end}
            bgImage={websiteConfig.website_video_bg_image}
            enableParallax={websiteConfig.website_video_enable_parallax}
            enableOverlay={websiteConfig.website_video_enable_overlay}
            overlayColor={websiteConfig.website_video_overlay_color}
            overlayOpacity={websiteConfig.website_video_overlay_opacity}
            textColor={websiteConfig.website_video_text_color}
          />
        )}

        {/* Custom Sections */}
        {websiteConfig.website_custom_sections?.map((section: any) =>
          section.visible ? (
            <CustomSectionPremium
              key={section.id}
              id={section.id}
              title={section.title}
              content={section.content}
              primaryColor={organization.primary_color}
            />
          ) : null
        )}

        {/* Contact */}
        <ContactSectionPremium
          name={organization.name}
          email={organization.email}
          phone={organization.phone}
          address={organization.address}
          city={organization.city}
          postalCode={organization.postal_code}
          primaryColor={organization.primary_color}
          showContactForm={websiteConfig.website_show_contact_form}
          showMap={websiteConfig.website_show_map}
          facebookUrl={organization.facebook_url}
          instagramUrl={organization.instagram_url}
          twitterUrl={organization.twitter_url}
          linkedinUrl={organization.linkedin_url}
          youtubeUrl={organization.youtube_url}
          tiktokUrl={organization.tiktok_url}
          openingHours={websiteConfig.website_opening_hours}
          onSubmitContact={onSubmitContact}
          bgType={websiteConfig.website_contact_bg_type}
          bgColor={websiteConfig.website_contact_bg_color}
          bgGradientStart={websiteConfig.website_contact_bg_gradient_start}
          bgGradientEnd={websiteConfig.website_contact_bg_gradient_end}
          bgImage={websiteConfig.website_contact_bg_image}
          enableParallax={websiteConfig.website_contact_enable_parallax}
          enableOverlay={websiteConfig.website_contact_enable_overlay}
          overlayColor={websiteConfig.website_contact_overlay_color}
          overlayOpacity={websiteConfig.website_contact_overlay_opacity}
          textColor={websiteConfig.website_contact_text_color}
        />

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Colonna 1: Info Azienda */}
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: organization.primary_color }}>
                  {organization.name}
                </h3>
                {organization.address && (
                  <p className="text-gray-400 text-sm mb-2 flex items-start gap-2">
                    <span className="mt-1">📍</span>
                    <span>
                      {organization.address}
                      {organization.city && `, ${organization.city}`}
                      {organization.postal_code && ` ${organization.postal_code}`}
                    </span>
                  </p>
                )}
                {organization.company_phone && (
                  <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${organization.company_phone}`} className="hover:text-white transition-colors">
                      {organization.company_phone}
                    </a>
                  </p>
                )}
                {organization.admin_email && (
                  <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${organization.admin_email}`} className="hover:text-white transition-colors">
                      {organization.admin_email}
                    </a>
                  </p>
                )}
                {organization.company_website && (
                  <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                    <span>🌐</span>
                    <a
                      href={organization.company_website.startsWith('http') ? organization.company_website : `https://${organization.company_website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {organization.company_website}
                    </a>
                  </p>
                )}
              </div>

              {/* Colonna 2: Dati Fiscali */}
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: organization.primary_color }}>
                  Dati Fiscali
                </h3>
                {organization.partita_iva && (
                  <p className="text-gray-400 text-sm mb-2">
                    <span className="font-semibold">P.IVA:</span> {organization.partita_iva}
                  </p>
                )}
                {organization.codice_fiscale && (
                  <p className="text-gray-400 text-sm mb-2">
                    <span className="font-semibold">C.F.:</span> {organization.codice_fiscale}
                  </p>
                )}
                {organization.industry && (
                  <p className="text-gray-400 text-sm mb-2">
                    <span className="font-semibold">Settore:</span> {organization.industry}
                  </p>
                )}
              </div>

              {/* Colonna 3: Social Media */}
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: organization.primary_color }}>
                  Seguici
                </h3>
                <div className="flex flex-wrap gap-3">
                  {organization.social_facebook && (
                    <a
                      href={organization.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ backgroundColor: `${organization.primary_color}20`, color: organization.primary_color }}
                      title="Facebook"
                    >
                      <span className="text-xl">f</span>
                    </a>
                  )}
                  {organization.social_instagram && (
                    <a
                      href={organization.social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ backgroundColor: `${organization.primary_color}20`, color: organization.primary_color }}
                      title="Instagram"
                    >
                      <span className="text-xl">📷</span>
                    </a>
                  )}
                  {organization.social_twitter && (
                    <a
                      href={organization.social_twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ backgroundColor: `${organization.primary_color}20`, color: organization.primary_color }}
                      title="Twitter"
                    >
                      <span className="text-xl">𝕏</span>
                    </a>
                  )}
                  {organization.social_linkedin && (
                    <a
                      href={organization.social_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ backgroundColor: `${organization.primary_color}20`, color: organization.primary_color }}
                      title="LinkedIn"
                    >
                      <span className="text-xl">in</span>
                    </a>
                  )}
                  {organization.youtube_url && (
                    <a
                      href={organization.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ backgroundColor: `${organization.primary_color}20`, color: organization.primary_color }}
                      title="YouTube"
                    >
                      <span className="text-xl">▶</span>
                    </a>
                  )}
                  {organization.tiktok_url && (
                    <a
                      href={organization.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ backgroundColor: `${organization.primary_color}20`, color: organization.primary_color }}
                      title="TikTok"
                    >
                      <span className="text-xl">🎵</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  {websiteConfig.website_footer_text || `© ${new Date().getFullYear()} ${organization.name}. Tutti i diritti riservati.`}
                </p>
                {(websiteConfig.website_show_powered_by ?? true) && (
                  <p className="text-gray-500 text-sm mt-2">
                    Powered by <span style={{ color: organization.primary_color }}>OMNILY PRO</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </footer>

        {/* GDPR Cookie Banner */}
        {websiteConfig.website_show_gdpr_banner && (
          <GDPRBanner
            primaryColor={organization.primary_color}
            organizationName={organization.name}
            privacyPolicyUrl={websiteConfig.website_privacy_policy_url}
            cookiePolicyUrl={websiteConfig.website_cookie_policy_url}
            position={websiteConfig.website_gdpr_banner_position || 'bottom'}
            showPreferences={websiteConfig.website_gdpr_show_preferences ?? true}
          />
        )}
      </div>
    </>
  )
}
