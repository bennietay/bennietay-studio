import { WebsiteSection, FeatureId } from "../types";
import { generateId } from "../lib/utils";

export interface SectionTemplate extends Omit<WebsiteSection, "id"> {
  featureId?: FeatureId;
}

export const SECTION_TEMPLATES: Record<string, SectionTemplate> = {
  hero: {
    type: "hero",
    content: {
      headline: "Strategic Growth for Modern Enterprises",
      subheadline:
        "We engineer high-performance solutions that enable businesses to scale with confidence and precision. Experience the intersection of innovation and heritage.",
      ctaText: "Explore our Framework",
      imageUrl:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920",
    },
    isVisible: true,
  },
  services: {
    type: "services",
    content: {
      title: "Core Competencies",
      description:
        "Our suite of services is designed to address the complex challenges of the modern marketplace.",
      items: [
        {
          title: "Strategic Consulting",
          description:
            "Deep-dive analysis and roadmap development for sustainable market leadership.",
          price: "Inquire for Pricing",
        },
        {
          title: "Digital Transformation",
          description:
            "Modernizing infrastructure and workflows with cutting-edge technology stacks.",
          price: "Project Based",
        },
        {
          title: "Creative Direction",
          description:
            "Defining brand narratives and visual identities that resonate with selective audiences.",
          price: "Custom Quote",
        },
      ],
    },
    isVisible: true,
  },
  about: {
    type: "about",
    content: {
      title: "The Architecture of Trust",
      text: "Founded on the belief that excellence is not an act but a habit, our firm has consistently pushed the boundaries of professional service. We don't just solve problems; we build the foundations for long-term success.\n\nOur methodology combines rigorous analytical frameworks with a deep understanding of human dynamics. Every engagement is treated as a unique orchestration of talent and strategy.",
    },
    isVisible: true,
  },
  features: {
    type: "features",
    content: {
      title: "The Competitive Advantage",
      description:
        "What defines the premium experience we deliver to our partners.",
      items: [
        "Proprietary analytical frameworks",
        "Global network of industry catalysts",
        "Uncompromising attention to detail",
        "Sustainable value creation focus",
      ],
    },
    isVisible: true,
  },
  pricing: {
    type: "pricing",
    content: {
      title: "Service Packages",
      description:
        "Transparent, value-aligned tiers designed for businesses at every stage of the growth curve.",
      plans: [
        {
          name: "Foundational",
          price: "2,499",
          isPopular: false,
          features: [
            "Core Strategy Assessment",
            "Performance Dashboard",
            "Priority Digital Support",
          ],
        },
        {
          name: "Professional",
          price: "5,999",
          isPopular: true,
          features: [
            "Full Infrastructure Audit",
            "Growth Implementation Plan",
            "Weekly Advisory Calls",
            "Dedicated Partner Lead",
          ],
        },
        {
          name: "Enterprise",
          price: "Custom",
          isPopular: false,
          features: [
            "Global Scale Orchestration",
            "On-site Strategic Immersion",
            "24/7 Concierge Support",
            "Unlimited Project Scope",
          ],
        },
      ],
    },
    isVisible: true,
  },
  testimonials: {
    type: "testimonials",
    featureId: "review_management",
    content: {
      items: [
        {
          name: "Alexander Vance",
          role: "Chief Executive Officer",
          text: "The architectural precision and strategic depth provided by this team completely redefined our market trajectory within the first quarter.",
        },
        {
          name: "Elena Sterling",
          role: "Creative Director",
          text: "Rarely do you find a partner that understands the delicate balance between high-fidelity aesthetics and rigorous commercial logic.",
        },
      ],
    },
    isVisible: true,
  },
  faq: {
    type: "faq",
    content: {
      items: [
        {
          question: "What defines your strategic approach?",
          answer:
            "Our methodology is rooted in first-principles thinking, combined with a deep understanding of modern digital ecosystems and human psychology. We prioritize sustainable metrics over vanity growth.",
        },
        {
          question: "How do you handle enterprise-scale integration?",
          answer:
            "Every infrastructure we build is designed for maximum elasticity. We use proprietary migration frameworks to ensure seamless synchronization with your existing legacy systems.",
        },
      ],
    },
    isVisible: true,
  },
  contact: {
    type: "contact",
    content: {},
    isVisible: true,
  },
  problem: {
    type: "problem",
    content: {
      title: "The Silent Growth Killer",
      description:
        "Inefficient systems and fragmented data are stalling your scale. Most businesses lose significant revenue due to operational friction and visibility gaps that go unnoticed until they become critical.",
      painPoints: [
        "Operational inefficiencies draining resources",
        "Lack of real-time performance visibility",
        "Inconsistent customer experiences",
        "Fragmented data slowing down decision making",
      ],
    },
    isVisible: true,
  },
  solution: {
    type: "solution",
    content: {
      title: "The Architecture of Excellence",
      description:
        "Our unified framework synchronizes your operations, intelligence, and growth engines into a single high-performance system. We help you eliminate friction and focus on what truly scales.",
      features: [
        "End-to-end operational synchronization",
        "Advanced predictive analytics engine",
        "Automated high-fidelity workflows",
      ],
    },
    isVisible: true,
  },
  benefits: {
    type: "benefits",
    content: {
      title: "Uncompromising Results",
      items: [
        {
          title: "Engineered Efficiency",
          description: "Optimize every touchpoint for maximum throughput.",
        },
        {
          title: "Revenue Acceleration",
          description: "Unlock hidden growth levers with precision data.",
        },
        {
          title: "Operational Clarity",
          description: "Full visibility into every aspect of your enterprise.",
        },
      ],
    },
    isVisible: true,
  },
  proof: {
    type: "proof",
    content: {
      title: "Measuring What Matters",
      stats: [
        { label: "Efficiency Gain", value: "45%" },
        { label: "Implementation Speed", value: "2x" },
        { label: "Average ROI", value: "3.5x" },
      ],
      logos: [],
    },
    isVisible: true,
  },
  cta: {
    type: "cta",
    content: {
      title: "Define Your Future State",
      description:
        "Schedule a strategy audit to discover where your business is leaking value and how to reclaim your growth trajectory.",
      buttonText: "Request Strategy Audit",
      secondaryButtonText: "View Case Studies",
    },
    isVisible: true,
  },
  appointment: {
    type: "appointment",
    featureId: "booking",
    content: {
      title: "Strategic Consultation",
      description:
        "Select a time for a deep-dive assessment of your current infrastructure and growth objectives.",
      buttonText: "Secure My Slot",
      calendarTitle: "Priority Booking",
      workingHours: "EST Business Hours",
      location: "Private Virtual Briefing",
    },
    isVisible: true,
  },
  blog_list: {
    type: "blog_list",
    featureId: "ai_synthesis",
    content: {
      title: "The Journal of Strategy",
      description: "Elite insights on engineering scale and market leadership.",
      showExcerpts: true,
      postsPerPage: 6,
    },
    isVisible: true,
  },
  blog_post: {
    type: "blog_post",
    content: {
      showAuthor: true,
      showDate: true,
      showImage: true,
    },
    isVisible: true,
  },
  text_content: {
    type: "text_content",
    content: {
      title: "Strategic Overview",
      body: "Our methodology is built on three core pillars: Precision, Scalability, and Longevity...",
    },
    isVisible: true,
  },
  products: {
    type: "product_list",
    featureId: "ecommerce",
    content: {
      title: "Our Boutique",
      description:
        "Discover our exclusive range of premium products and services.",
      items: [
        {
          name: "Signature Offering",
          description:
            "The peak of professional performance and strategic leverage.",
          price: "$2,499",
        },
        {
          name: "Elite Package",
          description:
            "Comprehensive growth acceleration with dedicated concierge support.",
          price: "$4,999",
        },
        {
          name: "Precision Suite",
          description:
            "Deep-dive analytics and optimization for enterprise-scale operations.",
          price: "$1,299",
        },
      ],
    },
    isVisible: true,
  },
  team: {
    type: "team",
    featureId: "ai_synthesis",
    content: {
      title: "Meet Our Team",
      description: "The experts behind our success.",
      members: [
        {
          name: "Dr. John Smith",
          role: "Senior Specialist",
          bio: "Over 20 years of experience in the field.",
          imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Dr. Sarah Johnson",
          role: "Lead Consultant",
          bio: "Expert in modern techniques and patient care.",
          imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    isVisible: true,
  },
  vision: {
    type: "about",
    content: {
      text: "### Our Vision\nTo revolutionize the industry through innovation and sustainable practices. We believe in a future where technology empowers every individual.\n\n### Our Mission\nDelivering high-quality solutions that create lasting value for our clients and the communities we serve.",
    },
    isVisible: true,
  },
  comparison: {
    type: "benefits",
    content: {
      title: "How We Compare",
      items: [
        {
          title: "vs Traditional",
          description: "5x faster implementation and 50% lower cost.",
        },
        {
          title: "vs Competitor A",
          description: "Integrated analytics and better user interface.",
        },
        {
          title: "vs Competitor B",
          description: "24/7 priority support and custom branding.",
        },
      ],
    },
    isVisible: true,
  },
  how_it_works: {
    type: "features",
    content: {
      title: "How It Works",
      items: [
        "Connect your accounts in seconds",
        "Configure your growth parameters",
        "Launch and monitor performance",
        "Optimize with AI-driven insights",
      ],
    },
    isVisible: true,
  },
  market_stats: {
    type: "proof",
    content: {
      title: "Measurable Impact",
      stats: [
        { label: "Market ROI", value: "340%" },
        { label: "Time Saved", value: "25h/mo" },
        { label: "Cost Reduction", value: "45%" },
      ],
      logos: [],
    },
    isVisible: true,
  },
  executive_team: {
    type: "team",
    content: {
      title: "Executive Leadership",
      description: "Strategic thinkers driving our long-term goals.",
      members: [
        {
          name: "Michael Chen",
          role: "CTO",
          bio: "Former lead engineer at Tech Giant.",
          imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Elena Rodriguez",
          role: "COO",
          bio: "Operations expert with global experience.",
          imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    isVisible: true,
  },
  newsletter: {
    type: "cta",
    content: {
      title: "Stay in the Loop",
      description: "Get the latest industry insights delivered to your inbox.",
      buttonText: "Subscribe Now",
      secondaryButtonText: "View Archive",
    },
    isVisible: true,
  },
  discovery_call: {
    type: "appointment",
    featureId: "booking",
    content: {
      title: "15-Minute Discovery Call",
      description: "A quick chat to see if we are a good fit for your project.",
      buttonText: "Book Now",
      calendarTitle: "Select a Slot",
      workingHours: "Flexible Availability",
      location: "Zoom/Google Meet",
    },
    isVisible: true,
  },
  problem_deep: {
    type: "problem",
    content: {
      title: "The Bottlenecks In Your Growth",
      description:
        "Scalability is often hindered by fragmented data and manual workflows that do not communicate.",
      painPoints: [
        "High operational overhead",
        "Data silos",
        "Resource burnout",
        "Slow time-to-market",
      ],
    },
    isVisible: true,
  },
  solution_reveal: {
    type: "solution",
    content: {
      title: "The Unified Growth Engine",
      description:
        "Our proprietary technology syncs every aspect of your business into a single, high-performance dashboard.",
      features: [
        "Automated syncing",
        "Smart prioritization",
        "Real-time forecasting",
      ],
    },
    isVisible: true,
  },
  detailed_services: {
    type: "services",
    content: {
      title: "Specialized Solutions",
      items: [
        {
          title: "Digital Transformation",
          description: "Legacy system modernization and cloud migration.",
        },
        {
          title: "AI Implementation",
          description: "Custom LLM fine-tuning and workflow automation.",
        },
        {
          title: "Growth Strategy",
          description: "Data-driven market expansion and user acquisition.",
        },
      ],
    },
    isVisible: true,
  },
};

export const createSectionFromTemplate = (type: string): WebsiteSection => {
  const template = SECTION_TEMPLATES[type];
  if (!template) throw new Error(`Template not found for type: ${type}`);

  // Deep clone to prevent shared state between sections
  return JSON.parse(
    JSON.stringify({
      ...template,
      id: generateId(),
    }),
  );
};
