//src/app/layout/sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Logo from "@/assets/images/logo/logo.png";
import LogoSmall from "@/assets/images/logo/logo-small.png";
import { motion, AnimatePresence } from "framer-motion";
import { RouteName } from "@/lib/route";
import SidebarMenu from "@/components/features/SidebarMenu";

const showAnimation = {
  hidden: { width: 0, opacity: 0, transition: { duration: 0.5 } },
  show: { opacity: 1, width: "auto", transition: { duration: 0.5 } },
};

interface SidebarProps {
  isSidebarOpen: boolean;
}

const Sidebar = ({ isSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      <style jsx global>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 0;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background-color: transparent;
        }
      `}</style>

      <div className="bg-white text-black h-screen overflow-y-auto scroll-smooth pb-5 sidebar-scrollbar">
        {isSidebarOpen ? (
          <div className="flex items-center justify-center pt-5 px-4 bg-white">
            <Image 
              src={Logo}
              alt="Logo" 
              width={120} 
              height={40} 
              style={{ height: 40, width: "auto" }} 
            />
          </div>
        ) : (
          <div className="flex justify-center items-center pt-5">
            <Image 
              src={LogoSmall}
              alt="Logo" 
              width={30} 
              height={15} 
              style={{ height: 15, width: "auto" }} 
            />
          </div>
        )}
        
        <section className="pt-[15px] pl-2.5 pr-0 pb-0 flex flex-col gap-[5px]">
          {RouteName.map((route, index) => {
            if (route.subRoutes) {
              return (
                <SidebarMenu
                  route={route}
                  key={index}
                  showAnimation={showAnimation}
                  isSidebarOpen={isSidebarOpen}
                />
              );
            }
            
            return (
              <div key={index}>
                <Link
                  href={route.path || "#"}
                  className={`
                    flex items-center gap-2.5 py-[5px] px-2.5 no-underline 
                    border-r-4 border-transparent my-[5px] mr-2.5 ml-0
                    transition-all duration-200 ease-[cubic-bezier(0.6,-0.28,0.735,0.045)]
                    hover:border-r-4 hover:border-white hover:bg-[#EF4444] hover:text-white 
                    hover:rounded-lg hover:rounded-tr-[10px] hover:rounded-br-[10px]
                    ${pathname === route.path 
                      ? "bg-[#EF4444] text-white border-r-4 border-white rounded-lg rounded-tr-[10px] rounded-br-[10px]" 
                      : "text-[#716767]"
                    }
                  `}
                >
                  {/* Icon hamesha dikhega - ye line add karna bhool gaye the! */}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {route.icon}
                  </div>

                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.div
                        variants={showAnimation}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className="whitespace-nowrap text-[15.5px] py-0.5"
                      >
                        {route.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
};

export default Sidebar;