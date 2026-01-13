
import { PoojaRouteSvg,
   OtherRouteSvg, CustomerRouteSvg,
    AstrologerRouteSvg , LiveRouteSvg,
    SkillRouteSvg, NotificationRouteSvg,
  RemediesRouteSvg, AnnouncementRouteSvg
,MainExpertiesRouteSvg, LanguageRouteSvg,
GiftRouteSvg, BlogsRouteSvg, BannerRouteSvg,
RatingRouteSvg, RechargeRouteSvg} from '../../public/assets/svg';

export const RouteName = [
  {
    path: "/",
    name: "Dashboard",
    icon: <OtherRouteSvg />,
  },
  {
    path: "/customer",
    name: "Customer",
    icon: <CustomerRouteSvg />,
  },
  // {
  //   path: "/pooja",
  //   name: "Puja",
  //   icon: <CustomerRouteSvg />,
  // },
  {
    name: "Gemstone",
    icon: <RatingRouteSvg />,
    subRoutes: [
      {
        path: "/gemstone-lead",
        name: "Gemstone Lead",
        icon: <CustomerRouteSvg />,
      },
      {
        path: "/gemstone-consultation",
        name: "Gemstone Consultation",
        icon: <CustomerRouteSvg />,
      },
    ],
  },
  {
    name: "Reports",
    icon: <NotificationRouteSvg />,
    subRoutes: [
      {
        path: "/reports/time-block-report",
        name: "Time Block",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/reports/report-consultation",
        name: "Report Consultations",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/reports/report-orders",
        name: "Report Order",
        icon: <OtherRouteSvg />,
      },
    ],
  },

  {
    name: "Astrologer",
    icon: <AstrologerRouteSvg />,
    subRoutes: [
      {
        path: "/astrologer",
        name: "List Of Astrologers",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/astrologer-enquiry",
        name: "Astrologer Enquiry",
        icon: <OtherRouteSvg />,
      },
      // {
      //   path: "/astrologer-issues",
      //   name: "Astrologer Issues",
      //   icon: <OtherRouteSvg />,
      // },
      // {
      //   path: "/leave-request",
      //   name: "Leave request",
      //   icon: <OtherRouteSvg />,
      // },
    ],
  },
  {
    name: "Astro Puja",
    icon: <PoojaRouteSvg />,
    subRoutes: [
      {
        path: "/astro-puja/category",
        name: "Category",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/pooja",
        name: "Puja",
        icon: <OtherRouteSvg />,
      },
      {
          path: "/pooja-bookings",
          name: "Puja Booking",
          icon: <OtherRouteSvg />,
      },
      // {
      //   path: "/astro-puja/puja-booked",
      //   name: "Puja Booked",
      //   icon: <OtherRouteSvg />,
      // }
    ],
  },
  // {
  //   name: "Live Session",
  //   icon: <LiveRouteSvg />,
  //   subRoutes: [
  //     {
  //       path: "/live-session/category",
  //       name: "Category",
  //       icon: <OtherRouteSvg />,
  //     },
  //     {
  //       path: "/live-session/topic",
  //       name: "Topic",
  //       icon: <OtherRouteSvg />,
  //     },
  //   ],
  // },
  // {
  //   name: "Notification",
  //   icon: <NotificationRouteSvg />,
  //   subRoutes: [
  //     {
  //       path: "/notification/customer-notification",
  //       name: "Customer Notification",
  //       icon: <OtherRouteSvg />,
  //     },
  //     {
  //       path: "/notification/astrologer-notification",
  //       name: "Astrologer Notification",
  //       icon: <OtherRouteSvg />,
  //     },
  //   ],
  // },
  // {
  //   path: "/consultation",
  //   name: "Consultation",
  //   icon: <SkillRouteSvg />,
  // },
  {
    name: "Consultation",
    icon: <NotificationRouteSvg />,
    subRoutes: [
      {
        path: "/consultation",
        name: "List of Consultations",
        icon: <SkillRouteSvg />
      },
      {
        path: "/logs/list-of-logs",
        name: "List of logs",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/first-consultation-price",
        name: "First Consultation Offer",
        icon: <OtherRouteSvg />,
      },
    ],
  },


  // {
  //   path: "/gift",
  //   name: "Gift",
  //   icon: <GiftRouteSvg />,
  // },
  // {
  //   path: "/banner",
  //   name: "Banner",
  //   icon: <BannerRouteSvg />,
  // },
  // {
  //   path: "/recharge",
  //   name: "Recharge",
  //   icon: <RechargeRouteSvg />,
  // },

  {
    name: "Astroblog",
    icon: <BlogsRouteSvg />,
    subRoutes: [
      {
        path: "/astro-blog/category",
        name: "Category",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/astro-blog/blog",
        name: "Blog",
        icon: <OtherRouteSvg />,
      },
    ],
  },
  {
    name: "Manage",
    icon: <OtherRouteSvg />,
    subRoutes: [
      {
        path: "/review",
        name: "Review",
        icon: <RatingRouteSvg />,
      },
      {
        path: "/main-expertise",
        name: "Main Expertise",
        icon: <MainExpertiesRouteSvg />,
      },
      {
        path: "/skill",
        name: "Skill",
        icon: <SkillRouteSvg />,
      },
      {
        path: "/remedies",
        name: "Remedies",
        icon: <RemediesRouteSvg />,
      },
      {
        path: "/language",
        name: "Language",
        icon: <LanguageRouteSvg />,
      },
      {
        path: "/master/slot-management",
        name: "Slot Management",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/master/platform-charges",
        name: "Platform Charge",
        icon: <OtherRouteSvg />,
      },
    ],
  },
  
  // {
  //   name: "Master",
  //   icon: <OtherRouteSvg />,
  //   subRoutes: [
  //     {
  //       path: "/master/slot-management",
  //       name: "Slot Management",
  //       icon: <OtherRouteSvg />,
  //     },
  //     {
  //       path: "/master/platform-charges",
  //       name: "Platform Charge",
  //       icon: <OtherRouteSvg />,
  //     },
  //     {
  //       path: "/master/predefined-message",
  //       name: "Predefined Message",
  //       icon: <OtherRouteSvg />,
  //     },
  //   ],
  // },
  {
    path: "/pages",
    name: "Pages",
    icon: <OtherRouteSvg />,
    subRoutes: [
      {
        path: "/pages/terms-and-conditions",
        name: "Terms and Conditions",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/pages/privacy-policy",
        name: "Privacy Policy",
        icon: <OtherRouteSvg />,
      },
      {
        path: "/pages/about-us",
        name: "About Us",
        icon: <OtherRouteSvg />,
      },
      // {
      //   path: "/displayHowToUse",
      //   name: "How to use- ScreenShots",
      //   icon: <OtherRouteSvg />,
      // },
      // {
      //   path: "/displayHowToUseVideos",
      //   name: "How to use - Videos",
      //   icon: <OtherRouteSvg />,
      // },
    ],
  },
  {
    path: "/reports/admin-earning",
    name: "Admin Earning",
    icon: <OtherRouteSvg />,
  },


  // {
  //   path: "/announcement",
  //   name: "Announcement",
  //   icon: <AnnouncementRouteSvg/>,
  // },
];