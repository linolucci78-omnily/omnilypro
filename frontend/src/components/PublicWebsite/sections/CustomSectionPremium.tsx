import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

interface CustomSectionPremiumProps {
  id: string
  title: string
  content: string
  primaryColor: string
}

export const CustomSectionPremium: React.FC<CustomSectionPremiumProps> = ({
  id,
  title,
  content,
  primaryColor,
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section
      id={`custom-${id}`}
      ref={ref}
      className="py-24 px-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, #ffffff 0%, ${primaryColor}05 50%, #ffffff 100%)`,
      }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <div
              className="w-16 h-1 mx-auto rounded-full"
              style={{ background: primaryColor }}
            />
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            {title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="prose prose-lg max-w-4xl mx-auto"
        >
          <div
            className="text-gray-700 leading-relaxed whitespace-pre-wrap text-center"
            style={{ fontSize: '1.125rem', lineHeight: '1.8' }}
          >
            {content}
          </div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 0.1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="absolute top-10 left-10 w-32 h-32 rounded-full blur-3xl"
          style={{ background: primaryColor }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 0.1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-10 right-10 w-40 h-40 rounded-full blur-3xl"
          style={{ background: primaryColor }}
        />
      </div>
    </section>
  )
}
