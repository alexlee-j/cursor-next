declare module 'react-simple-captcha' {
  export function loadCaptchaEnginge(
    charsCount: number,
    backgroundColor?: string,
    fontColor?: string,
    height?: number,
    width?: number,
    font?: string
  ): void;

  export function validateCaptcha(userCaptcha: string, successCallback?: () => void, failureCallback?: () => void): boolean;

  export function LoadCanvasTemplate(props: {
    reloadColor?: string;
    reload?: boolean;
  }): JSX.Element;
  export function LoadCanvasTemplateNoReload(): JSX.Element;
}
