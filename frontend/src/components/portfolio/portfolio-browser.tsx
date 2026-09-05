"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ApprovedIcon } from "@/components/ui/approved-icon";
import type { PortfolioCategoryCard } from "@/content/portfolio";

const tones = ["rings", "squares", "hex", "orbit", "window", "triangle"];
export function PortfolioBrowser({
  categories,
}: {
  categories: PortfolioCategoryCard[];
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="portfolio-grid"
      initial="hidden"
      animate="show"
      variants={{
        show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
      }}
    >
      {categories.map((category, index) => (
        <motion.article
          variants={{
            hidden: { opacity: 0, y: reduce ? 0 : 18 },
            show: { opacity: 1, y: 0 },
          }}
          key={category.slug}
          className="portfolio-list-card"
        >
          {category.cardMedia ? (
            <div className="case-art">
              <Image
                src={category.cardMedia.secureUrl || category.cardMedia.url}
                alt={category.cardMedia.altText}
                fill
                sizes="(max-width: 767px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              className={`case-art case-art-${tones[index % tones.length]}`}
              role="img"
              aria-label={`${category.name} category artwork`}
            >
              {category.iconKey ? (
                <ApprovedIcon iconKey={category.iconKey} />
              ) : (
                <>
                  <i />
                  <i />
                  <i />
                </>
              )}
            </div>
          )}
          <div>
            <span>{category.name}</span>
            <h2>{category.cardTitle || category.name}</h2>
            <p>{category.description}</p>
            {category.slug ? (
              <Link href={`/portfolio/category/${category.slug}`}>
                Explore More <ArrowRight />
              </Link>
            ) : (
              <span className="portfolio-link-disabled" aria-disabled="true">
                No published project
              </span>
            )}
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}
