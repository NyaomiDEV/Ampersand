import { RouteRecordRaw } from "vue-router";

const onboarding: Array<RouteRecordRaw> = [
    { 
        path: '/onboarding/start',
        name: 'OnboardingStart',
        component: () => import("../views/onboarding/OnboardingStart.vue")

    },
    {
        path: '/onboarding/end',
        name: 'OnboardingEnd',
        component: () => import("../views/onboarding/OnboardingEnd.vue")
    },
    {
        path: '/onboarding/import',
        name: 'OnboardingImport',
        component: () => import("../views/onboarding/OnboardingImport.vue")
    },
    {
        path: '/onboarding/system',
        name: 'OnboardingSystemSetup',
        component: () => import("../views/onboarding/OnboardingSystem.vue")
    },
    {
        path: '/onboarding/member',
        name: 'OnboardingMemberSetup',
        component: () => import("../views/onboarding/OnboardingMember.vue")
    }
];

export default onboarding;