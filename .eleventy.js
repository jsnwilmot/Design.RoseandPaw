module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ images: "images" });
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("CNAME");

  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));
  eleventyConfig.addFilter("absoluteUrl", (value, baseUrl) => new URL(value, baseUrl).href);
  eleventyConfig.addFilter("structuredData", (pageKey, canonical, breadcrumbName, business, packages, faq) => {
    const breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: business.url },
        ...(pageKey === "home" ? [] : [{ "@type": "ListItem", position: 2, name: breadcrumbName, item: canonical }])
      ]
    };
    let graph = [breadcrumb];

    if (pageKey === "home") {
      graph = [
        {
          "@type": ["LocalBusiness", "ProfessionalService"],
          "@id": `${business.url}#business`,
          name: business.name,
          url: business.url,
          logo: new URL(business.logo, business.url).href,
          image: new URL(business.defaultOgImage, business.url).href,
          description: business.description,
          telephone: business.telephone,
          email: business.email,
          priceRange: "$$",
          serviceType: ["Website design", "SEO setup", "Business profile setup", "Google Business Profile setup", "Yelp Business Profile setup", "Business card design", "Social media graphics"],
          address: { "@type": "PostalAddress", addressLocality: business.locality, addressRegion: business.region, addressCountry: business.country },
          areaServed: { "@type": "Country", name: business.serviceArea },
          openingHoursSpecification: { "@type": "OpeningHoursSpecification", description: "By appointment only" },
          sameAs: [business.facebookUrl],
          makesOffer: {
            "@type": "OfferCatalog",
            name: "Small business digital design services",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Website design", description: "Clean, mobile-friendly static websites for small businesses." } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "SEO optimization", description: "Practical SEO foundations, metadata, headings, image alt text, internal links, sitemap, robots.txt, and structured data." } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Business profile setup", description: "Google Business Profile and Yelp Business Profile setup or cleanup for small businesses." } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Print and social graphics", description: "Business cards, social media posts, flyers, price lists, service menus, and basic graphic design." } }
            ]
          }
        },
        {
          "@type": "Organization",
          "@id": `${business.url}#organization`,
          name: business.name,
          url: business.url,
          logo: new URL(business.logo, business.url).href,
          contactPoint: { "@type": "ContactPoint", telephone: business.telephone, email: business.email, contactType: "customer service", areaServed: "CA" }
        },
        { "@type": "WebSite", "@id": `${business.url}#website`, url: business.url, name: business.name, publisher: { "@id": `${business.url}#organization` } },
        breadcrumb
      ];
    } else if (pageKey === "services") {
      graph.push({
        "@type": "Service",
        "@id": `${canonical}#services`,
        name: "Small Business Website Design Services",
        provider: { "@id": `${business.url}#business` },
        areaServed: business.serviceArea,
        serviceType: ["Website design", "Basic SEO setup", "Google Business Profile setup", "Yelp Business Profile setup", "Business card design", "Social media graphics", "Graphic design support"]
      });
    } else if (pageKey === "packages") {
      graph.push({
        "@type": "OfferCatalog",
        name: "Website Design Packages for Small Businesses",
        url: canonical,
        itemListElement: packages.map((item) => ({ "@type": "Offer", name: item.name, price: item.price, priceCurrency: "CAD" }))
      });
    } else if (pageKey === "faq") {
      graph.push({
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }))
      });
    }

    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
