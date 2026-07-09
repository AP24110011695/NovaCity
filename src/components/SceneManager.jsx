import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import IntroSequence from './IntroSequence'
import LoadingScene from './LoadingScene'
import SpaceScene from './SpaceScene'
import AtmosphereTransition from './AtmosphereTransition'
import CityReveal from './CityReveal'

const SCENES = {
  INTRO: 'intro',
  LOADING: 'loading',
  SPACE: 'space',
  ATMOSPHERE: 'atmosphere',
  CITY: 'city',
}

const BLACK_HOLD_DURATION = 1500
const MISSION_FADE_DURATION = 350
const SCENE_FADE_DURATION = 0.8

const sceneVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: SCENE_FADE_DURATION, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: SCENE_FADE_DURATION, ease: 'easeInOut' } },
}

const SceneManager = () => {
  const [scene, setScene] = useState(SCENES.INTRO)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const handleIntroEnter = useCallback(() => {
    setIsFadingOut(true)
    setTimeout(() => {
      setScene(SCENES.LOADING)
      setIsFadingOut(false)
    }, BLACK_HOLD_DURATION)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setScene(SCENES.SPACE)
  }, [])

  const handleEnterMission = useCallback(() => {
    setIsFadingOut(true)
    setTimeout(() => {
      setScene(SCENES.ATMOSPHERE)
      setIsFadingOut(false)
    }, MISSION_FADE_DURATION)
  }, [])

  const handleAtmosphereComplete = useCallback(() => {
    setScene(SCENES.CITY)
  }, [])

  if (scene === SCENES.CITY) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <CityReveal />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {scene === SCENES.INTRO && (
          <motion.div
            key="intro"
            variants={sceneVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
          >
            <IntroSequence onEnter={handleIntroEnter} />
          </motion.div>
        )}

        {scene === SCENES.LOADING && (
          <motion.div
            key="loading"
            variants={sceneVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
          >
            <LoadingScene onComplete={handleLoadingComplete} />
          </motion.div>
        )}

        {scene === SCENES.SPACE && (
          <motion.div
            key="space"
            variants={sceneVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
          >
            <SpaceScene onEnterMission={handleEnterMission} />
          </motion.div>
        )}

        {scene === SCENES.ATMOSPHERE && (
          <motion.div
            key="atmosphere"
            variants={sceneVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
          >
            <AtmosphereTransition onComplete={handleAtmosphereComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFadingOut && (
          <motion.div
            key="fade-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 z-50 bg-black"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SceneManager