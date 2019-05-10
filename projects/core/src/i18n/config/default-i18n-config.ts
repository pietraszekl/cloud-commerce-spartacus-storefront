import { I18nConfig } from './i18n-config';

export const defaultI18nConfig: I18nConfig = {
  i18n: {
    fallbackLang: false,
    debug: false,
    chunks: {
      common: ['common', 'spinner', 'header', 'searchBox', 'sorting'],
      cart: ['cartDetails', 'cartItems', 'orderCost'],
      address: ['addressForm', 'addressBook', 'addressCard'],
      myAccount: ['orderDetails', 'orderHistory', 'myInterests'],
      payment: ['paymentForm', 'paymentMethods', 'paymentCard'],
      storeFinder: ['storeFinder'],
      pwa: ['pwa'],
      checkout: [
        'checkout',
        'checkoutAddress',
        'checkoutOrderConfirmation',
        'checkoutReview',
        'checkoutShipping',
      ],
      product: [
        'productDetails',
        'productList',
        'productFacetNavigation',
        'productSummary',
        'productReview',
        'addToCart',
      ],
      user: [
        'forgottenPassword',
        'loginForm',
        'login',
        'register',
        'updateEmailForm',
        'updatePasswordForm',
        'updateProfileForm',
      ],
    },
  },
};
