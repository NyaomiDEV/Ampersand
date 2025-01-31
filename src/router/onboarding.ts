import { RouteRecordRaw } from "vue-router";

const onboarding: Array<RouteRecordRaw> = [
    { 
        path: '/onboarding/start',
        name: 'Onboarding Start',
        component: () => import("../views/onboarding/OnboardingStart.vue")

    },
    {
        path: '/onboarding/end',
        name: 'Onboarding End',
        component: () => import("../views/onboarding/OnboardingEnd.vue")
    },
    {
        path: '/onboarding/import',
        name: 'Onboarding Import',
        component: () => import("../views/onboarding/OnboardingImport.vue")
    },
    {
        path: '/onboarding/system',
        name: 'Onboarding System',
        component: () => import("../views/onboarding/OnboardingSystem.vue")
    },
    {
        path: '/onboarding/member',
        name: 'Onboarding Member',
        component: () => import("../views/onboarding/OnboardingMember.vue")
    }
];




export default onboarding;