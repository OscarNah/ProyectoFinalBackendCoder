const passport = require("passport");
const jwt = require("passport-jwt");
const JWTStrategy = jwt.Strategy;
const ExtractJwt = jwt.ExtractJwt;
const GitHubStrategy = require("passport-github2");
const UserModel = require("../models/user.model.js");

const initializePassport = () => {
    passport.use("jwt", new JWTStrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]), // Utiliza ExtractJwt.fromExtractors para extraer el token de la cookie
        secretOrKey: "coderhouse"
    }, async (jwt_payload, done) => {
        try {
            // Busca el usuario en la base de datos usando el ID del payload JWT
            const user = await UserModel.findById(jwt_payload.user._id);
            if (!user) {
                return done(null, false);
            }
            return done(null, user); // Devuelve el usuario encontrado
        } catch (error) {
            return done(error);
        }
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
          const user = await UserModel.findById(id);
          done(null, user);
        } catch (error) {
          done(error);
        }
      });
      

    passport.use(
        "github",
        new GitHubStrategy(
            {
                clientID: "Iv1.d583637334272d80",
                clientSecret: "73d951e204985a5ffc2c14b49b352a21a48f8982",
                callbackURL: "http://localhost:8080/api/users/auth/github/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                console.log(profile); // Información de GitHub del usuario que ingresa
                try {
                    let user = await UserModel.findOne({ email: profile._json.email });
                    if (!user) {
                        let newUser = {
                            first_name: profile._json.name,
                            last_name: "secreto",
                            age: 37,
                            email: profile._json.email,
                            password: "secreto",
                        };
                        let result = await UserModel.create(newUser);
                        done(null, result);
                    } else {
                        done(null, user);
                    }
                } catch (error) {
                    return done(error);
                }
            }
        )
    );
}

const cookieExtractor = (req) => {
    let token = null;
    if(req && req.cookies) {
        token = req.cookies["coderCookieToken"]
    }
    return token;
}

module.exports = initializePassport;
