<script setup>
import img0 from '~/assets/images/onboardingImages/addYards/img0.png'
import img1 from '~/assets/images/onboardingImages/addYards/img1.png'
import img2 from '~/assets/images/onboardingImages/addYards/img2.png'
import img3 from '~/assets/images/onboardingImages/addYards/img3.png'
import img4 from '~/assets/images/onboardingImages/addYards/img4.png'
import img5 from '~/assets/images/onboardingImages/addYards/img5.png'
import img6 from '~/assets/images/onboardingImages/addYards/img6.png'
import img7 from '~/assets/images/onboardingImages/addYards/img7.png'
import img8 from '~/assets/images/onboardingImages/addYards/img8.png'
import img9 from '~/assets/images/onboardingImages/addYards/img9.png'
import img10 from '~/assets/images/onboardingImages/addYards/img10.png'

import img00 from '~/assets/images/onboardingImages/onboardingDocument/img0.png'
import img01 from '~/assets/images/onboardingImages/onboardingDocument/img1.png'
import img02 from '~/assets/images/onboardingImages/onboardingDocument/img2.png'
import img03 from '~/assets/images/onboardingImages/onboardingDocument/img3.png'
import img04 from '~/assets/images/onboardingImages/onboardingDocument/img4.png'
import img05 from '~/assets/images/onboardingImages/onboardingDocument/img5.png'
import img06 from '~/assets/images/onboardingImages/onboardingDocument/img6.png'

const router = useRouter()
const slides = [
  {
    src: img0,
    description: 'Add your first yard by clicking on settings',
  },
  {
    src: img1,
    description: 'Click the "Address *" field and type the address of your facility',
  },
  {
    src: img2,
    description: 'Select the correct address from Google dropdown',
  },
  {
    src: img3,
    description: 'Give your export facility a label that you can easily identify',
  },
  {
    src: img4,
    description: 'Click add to add the facility',
  },
  {
    src: img5,
    description:
      'Click "Save" to save it to your account. You can also click the pencil icon to set specific contact information and hours for this facility',
  },
  {
    src: img6,
    description:
      'After clicking the pencil icon you can update the contacts for the yard and set the yard hours',
  },
  {
    src: img7,
    description: 'You can select the operating hours from this page as well',
  },
  {
    src: img8,
    description:
      'After setting up the hours you can add any special instructions for that facility or tips for picking up. None of this specific information is shared with truckers unless you have approved them already',
  },
  {
    src: img9,
    description: 'Click the "Instructions for the pickup *" field',
  },
  {
    src: img10,
    description: 'Click "Set details" to save',
  },
]
const slides2 = [
  {
    src: img00,
    description: 'Navigate to settings',
  },
  {
    src: img01,
    description: 'Click on Trucker Management',
  },
  {
    src: img02,
    description: 'Click on "Required Onboarding Documents"',
  },
  {
    src: img03,
    description: 'Upload an example or a docx/PDF list of the information you need to onboard trucking companies successfully',
  },
  {
    src: img04,
    description: 'Label what the file is',
  },
  {
    src: img05,
    description: 'You can save this with any title',
  },
  {
    src: img06,
    description: 'When you approve a trucker these documents will be sent to them to complete and send back for your approval',
  },
]

const tour = ref(null)
const tour2 = ref(null)
const slider = ref(0)
</script>

<template>
  <div class="p-8">
    <Button @click="tour.show(true)"> How to add your first yard</Button>
    <Button @click="tour2.show(true)"> Onboarding Document Guide</Button>
    <OnboardingTour
      ref="tour"
      v-model="slider"
      :slides="slides"
      header="How to add your first yard"
    >
      <div
        v-if="slider === slides.length - 1"
        class="flex justify-center mt-6"
      >
        <Button
          density="compact"
          @click="router.push({ name: 'settings' })"
        >
          Go to settings
        </Button>
      </div>
    </OnboardingTour>
    <OnboardingTour
      ref="tour2"
      v-model="slider"
      :slides="slides2"
      header="Onboarding Document Guide"
    >
      <div
        v-if="slider === slides2.length - 1"
        class="flex justify-center mt-6"
      >
        <Button
          density="compact"
          @click="router.push({ name: 'settings' })"
        >
          Go to settings
        </Button>
      </div>
    </OnboardingTour>
  </div>
</template>

<route lang="yaml">
meta:
requiresAuth: true
</route>
