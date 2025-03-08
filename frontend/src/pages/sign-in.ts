import { map } from "rxjs";
import { btn, checkbox, formControl, progressBar } from "../components";
import { bind, component, effect, observe } from "../core";
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import './sign-in.scss';
import { removeUser, setUser, userPool } from "../services/user.service";
import { router } from "../router";


const signInForm = bind({
    username: "",
    password: "",
    rememberMe: false
});

const username = signInForm.map(x => x.username, (state, v) => ({ ...state, username: v }));
const password = signInForm.map(x => x.password, (state, v) => ({ ...state, password: v }));
const rememberMe = signInForm.map(x => x.rememberMe, (state, v) => ({ ...state, rememberMe: v }));

const errorLog = bind<string>("");

const resetPasswordRequired = bind<boolean>(false);
const loading = bind<boolean>(false);
let currentUser: AmazonCognitoIdentity.CognitoUser | null = (null);


// Function to handle the login
const signIn = () => {
    const authenticationData = {
        Username: username.value,
        Password: password.value,
    };

    if (!authenticationData.Password || !authenticationData.Username) {
        return
    }


    loading.value = true;

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    const userData = {
        Username: username.value,
        Pool: userPool,
    };

    currentUser = new AmazonCognitoIdentity.CognitoUser(userData);

    currentUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: AmazonCognitoIdentity.CognitoUserSession) => {
            console.log("Login successful:", result);
            loading.value = false;
            setUser(result);
            router.navigateTo('/');
        },
        onFailure: (err: Error) => {
            console.error("Login failed:", err);
            errorLog.value = `Login failed: ${err.message}`;
            loading.value = false;
        },
        newPasswordRequired: (userAttributes, callback) => {
            console.log('User is required to set a new password');

            password.value = ""
            resetPasswordRequired.value = true;
        }
    });
};

const verifiedPassword = bind<string>("");
const resetPassword = () => {
    loading.value = true;
    console.log('User is required to set a new password');

    if (password.value !== verifiedPassword.value) {
        throw new Error("Паролі не однакові");
    }

    if (!currentUser) {
        throw new Error("Немає сесії");
    }

    currentUser.completeNewPasswordChallenge(password.value, {}, {
        onSuccess: (result) => {
            console.log('New password set successfully:', result);
            resetPasswordRequired.value = false;
            loading.value = false;
            verifiedPassword.value = "";
        },
        onFailure: (err) => {
            console.log('Failed to set new password:', err);
            loading.value = false;
        }
    });
}

const loader = loading.asObservable().pipe(map(x => x ? progressBar : ""));

const signInControls = component.html` 
<h1>Увійти</h1>
<div class="sign-in__controls">
    ${formControl("Емейл", username)}
    ${formControl("Пароль", password, { type: 'password' })}
    ${checkbox("Remember Me", rememberMe)}
</div>
<div class="sign-in__actions">
    ${btn("Увійти", signIn)}
</div>`;

const resetPasswordControls = component.html`
<h1>Змінити пароль</h1>
<div class="sign-in__controls">
    ${formControl("Пароль", password, { type: 'password' })}
    ${formControl("Підтвердіть Пароль", verifiedPassword, { type: 'password' })}
</div>
<div class="sign-in__actions">
    ${btn("Оновити пароль", resetPassword)}
</div>`;

const content = resetPasswordRequired.asObservable().pipe(map(x => x ? resetPasswordControls : signInControls));

export const signinPage = component.html`
<div class="sign-in"> 
    ${observe(loader)}

    <div class="sign-in__container"> 
        <form class="sign-in__form"> 
            ${errorLog}
            ${observe(content)}

        </form>
    </div>
</div>`.afterViewInit(v => {
    const form = v.getElem().getElementsByTagName('form')[0];
    removeUser();

    form.addEventListener('submit', function (event) {
        event.preventDefault();
    });
});
