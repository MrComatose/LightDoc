import { BehaviorSubject, map, Observable, ReplaySubject, switchMap } from "rxjs";
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import { jwtDecode, JwtPayload } from 'jwt-decode';



// Define Cognito User Pool Data
const poolData = {
    UserPoolId: 'eu-central-1_GiIYi8o81',  // Your Cognito User Pool ID
    ClientId: '5udggb0rmchu654vp6t85ft9fe',      // Your Cognito App Client ID
};

export const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const user = userPool.getCurrentUser();
const userStore = new ReplaySubject<AmazonCognitoIdentity.CognitoUserSession | null>(1);
if (user) {
    user.getSession((_: any, session: AmazonCognitoIdentity.CognitoUserSession) => {
        userStore.next(session)
    })
} else {
    userStore.next(null);
}


export const user$ = userStore.asObservable();
export const setUser = (user: AmazonCognitoIdentity.CognitoUserSession) => {
    userStore.next(user)
};

export const removeUser = () => {
    userPool.getCurrentUser()?.signOut();
    userStore.next(null)
};

export const getClaims = (): Observable<{ email: string | null, sub: string | null } | null> => user$.pipe(
    map((session) => {
        if (!session || !session.getIdToken()) {
            return null;
        }

        const idToken = session.getIdToken().getJwtToken();

        try {
            const decodedToken = jwtDecode<JwtPayload & { email: string }>(idToken);

            return {
                email: decodedToken.email || null,
                sub: decodedToken.sub || null
            };
        } catch (error) {
            console.error("Error decoding idToken:", error);
            return null;
        }
    })
);
