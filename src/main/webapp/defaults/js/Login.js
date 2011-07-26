/*
Copyright 2009-2010 University of Cambridge
Copyright 2009-2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0. 
ou may not use this file except in compliance with this License.

You may obtain a copy of the ECL 2.0 License at
https://source.collectionspace.org/collection-space/LICENSE.txt
*/

/*global jQuery, fluid, cspace:true*/

cspace = cspace || {};

(function ($, fluid) {
    fluid.log("Login.js loaded");

    var showSignIn = function (domBinder) {
        domBinder.locate("signIn").show();
        domBinder.locate("userID").focus();
        domBinder.locate("enterEmail").hide();
        domBinder.locate("resetRequest").hide();
    };

    var showResetRequestForm = function (domBinder) {
        domBinder.locate("signIn").hide();
        domBinder.locate("enterEmail").show();
        domBinder.locate("email").focus();
        domBinder.locate("resetRequest").hide();
    };
    
    var displayMessage = function (messageBar, data) {
        if (data.messages) {
            // TODO: expand this branch as sophistication increases for CSPACE-3142
            fluid.each(data.messages, function(message) {
                messageBar.show(message.message, null, data.isError);
            });
        }
        else {
            messageBar.show(data.message, null, data.isError);
        }
    };

    var showEmailSubmittedPage = function (messageBar, domBinder, data) {
        if (data.isError !== true) {
            domBinder.locate("enterEmailForm").hide();
        }
        displayMessage(messageBar, data)
    };

    var showReset = function (domBinder) {
        domBinder.locate("signIn").hide();
        domBinder.locate("enterEmail").hide();
        domBinder.locate("resetRequest").show();
        domBinder.locate("newPassword").focus();
    };

    var showPasswordReset = function (messageBar, domBinder, data) {
        if (data.isError !== true) {
            domBinder.locate("signIn").show();
            domBinder.locate("enterEmail").hide();
            domBinder.locate("resetRequest").hide();
        }
        displayMessage(messageBar, data)
    };

    var makeRequiredFieldsValidator = function (messageBar, domBinder, formType, message) {
        return function (e) {
            var requiredFields = domBinder.locate(formType + "Required");
            var missing = false;
            var firstMissing = -1;
            for (var i = 0; i < requiredFields.length; i++) {
                if ($(requiredFields[i]).val() === "") {
                    missing = true;
                    firstMissing = i;
                    break;
                }
            }
            if (!missing) {
                messageBar.hide();
                return true;
            } else {
                messageBar.show(message, null, true);
                requiredFields[firstMissing].focus();
                return false;
            }
        };
    };

    var emailFormValid = function (messageBar, domBinder, message) {
        return makeRequiredFieldsValidator(messageBar, domBinder, "email", message)();      
    };

    var passwordFormValid = function (messageBar, domBinder, allRequiredMessage, mustMatchMessage) {
        if (!makeRequiredFieldsValidator(messageBar, domBinder, "password", allRequiredMessage)()) {
            return false;
        }
        if (domBinder.locate("newPassword").val() !== domBinder.locate("confirmPassword").val()) {
            messageBar.show(mustMatchMessage, null, true);
            domBinder.locate("newPassword").focus();
            return false;
        }
        return true;
    };

    var submitEmail = function (email, url, that) {
        if (cspace.util.useLocalData()) {
            var mockResponse = {message: "Success", ok: true};
            that.events.emailSubmitted.fire(mockResponse);
        } else {
            jQuery.ajax({
                url: url,
                type: "POST",
                dataType: "json",
                data: JSON.stringify({"email": email}),
                success: that.events.emailSubmitted.fire,
                error: that.events.onError.fire
            });
        }
    };
    
    var submitNewPassword = function (password, url, that) {
        if (cspace.util.useLocalData()) {
            var mockResponse = {message: "Success", isError: false};
            showPasswordReset(that.messageBar, that.dom, mockResponse);
            that.events.passwordSubmitted.fire(mockResponse);
        } else {
            jQuery.ajax({
                url: url,
                type: "POST",
                dataType: "json",
                data: JSON.stringify({"password": password, "token": that.token, "email": that.email}),
                success: that.events.passwordSubmitted.fire,
                error: that.events.onError.fire
            });
        }
    };

    var makeEmailSubmitter = function (that) {
        return function (e) {
            that.submitEmail();
        };
    };

    var makePasswordSubmitter = function (that) {
        return function (e) {
            that.submitNewPassword();
        };
    };
    
    var bindEventHandlers = function (that) {
        that.locate("requestReset").click(function (e) {
            that.messageBar.hide();
            showResetRequestForm(that.dom);
        });
        that.locate("submitEmail").click(makeEmailSubmitter(that));
        that.locate("submitNewPassword").click(makePasswordSubmitter(that));

        that.events.emailSubmitted.addListener(function (data, statusText) {
            showEmailSubmittedPage(that.messageBar, that.dom, data);
        });
        that.events.passwordSubmitted.addListener(function (data, statusText) {
            showPasswordReset(that.messageBar, that.dom, data);
        });
        
        that.events.onError.addListener(function () {
            that.messageBar.show(that.lookupMessage("login-generalError"), null, true);            
        });

        that.locate("loginForm").submit(makeRequiredFieldsValidator(that.messageBar, that.dom, "login", that.lookupMessage("login-allFieldsRequired")));
        that.locate("resetRequest").submit(makeRequiredFieldsValidator(that.messageBar, that.dom, "password", that.lookupMessage("login-allFieldsRequired")));
    };

    fluid.defaults("cspace.login", {
        gradeNames: ["fluid.rendererComponent", "autoInit"],
        postInitFunction: "cspace.login.postInit",
        finalInitFunction: "cspace.login.finalInit",
        parentBundle: "{globalBundle}",
        events: {
            emailSubmitted: null,
            passwordSubmitted: null,
            onError: null
        },
        selectors: {
            loginForm: ".csc-login-loginForm",
            signIn: ".csc-login-signIn",
            userID: ".csc-login-userId",
            password: ".csc-login-password",
            loginButton: ".csc-login-button",
            requestReset: ".csc-login-requestReset",
            loginRequired: ".csc-login-loginRequired",

            enterEmail: ".csc-login-enterEmail",
            enterEmailMessage: ".csc-login-enterEmailMessage",
            enterEmailForm: ".csc-login-enterEmailForm",
            email: ".csc-login-email",
            submitEmail: ".csc-login-submitEmail",
            emailRequired: ".csc-login-emailRequired",

            resetRequest: ".csc-login-resetRequest",
            newPassword: ".csc-login-newPassword",
            confirmPassword: ".csc-login-confirmPassword",
            submitNewPassword: ".csc-login-submitNewPassword",
            passwordRequired: ".csc-login-passwordRequired",
            
            currentReleaseHeader: ".csc-login-current",
            currentReleaseInfo: ".csc-login-current-info",
            currentReleaseDetails: ".csc-login-current-details",
            loginInfo: ".csc-login-login-info",
            loginLogin: ".csc-login-login",
            loginPwd: ".csc-login-login-pwd",
            loginPwdValue: ".csc-login-login-pwdValue",
            rologinInfo: ".csc-login-rologin-info",
            rologinLogin: ".csc-login-rologin",
            rologinPwd: ".csc-login-rologin-pwd",
            rologinPwdValue: ".csc-login-rologin-pwdValue",
            footerFirst: ".csc-login-details-footer-first",
            footerLink: ".csc-login-details-footer-link",
            footerLast: ".csc-login-details-footer-last",
            loginHeader: ".csc-login-header",
            loginEmailHeader: ".csc-login-email-label",
            loginPasswordHeader: ".csc-login-password-label",
            loginForgot: ".csc-login-forgot",
            loginResetLabel: ".csc-login-reset-label",
            loginResetHeader: ".csc-login-reset-header",
            loginBack: ".csc-login-back",
            loginNewPasswordNote: ".csc-login-newPassword-note",
            loginPasswordInstructions: ".csc-login-password-instructions",
            loginNewPasswordLabel: ".csc-login-newPwd-label",
            loginConfirmPasswordLabel: ".csc-login-confirmPwd-label"
        },
        protoTree: {
            footerFirst: {
                messagekey: "login-footerFirst"
            },
            footerLink: {
                target: "${otherTenant}",
                linktext: {
                    messagekey: "login-footerLink"
                }
            },
            footerLast: {
                messagekey: "login-footerLast"
            },
            currentReleaseHeader: {
                messagekey: "login-current"
            },
            currentReleaseInfo: {
                messagekey: "login-current-info"
            },
            currentReleaseDetails: {
                messagekey: "login-current-details"
            },
            loginInfo: {
                messagekey: "login-login-info"
            },
            loginLogin: {
                messagekey: "login-login"
            },
            loginPwd: {
                messagekey: "login-login-pwd"
            },
            loginPwdValue: {
                messagekey: "login-login-pwdValue"
            },
            rologinInfo: {
                messagekey: "login-rologin-info"
            },
            rologinLogin: {
                messagekey: "login-rologin"
            },
            rologinPwd: {
                messagekey: "login-rologin-pwd"
            },
            rologinPwdValue: {
                messagekey: "login-rologin-pwdValue"
            },
            loginHeader: {
                messagekey: "login-header"
            },
            loginEmailHeader: {
                messagekey: "login-email-label"
            },
            loginPasswordHeader: {
                messagekey: "login-password-label"
            },
            loginButton: {
                messagekey: "login-loginButton"
            },
            loginForgot: {
                messagekey: "login-forgot"
            },
            loginResetLabel: {
                messagekey: "login-reset-label"
            },
            loginResetHeader: {
                messagekey: "login-reset-header"
            },
            enterEmailMessage: {
                messagekey: "login-enterEmailMessage"
            },
            submitEmail: {
                messagekey: "login-submitEmail"
            },
            loginBack: {
                messagekey: "login-loginBack"
            },
            loginNewPasswordNote: {
                messagekey: "login-loginNewPasswordNote"
            },
            loginPasswordInstructions: {
                messagekey: "login-loginPasswordInstructions"
            },
            loginNewPasswordLabel: {
                messagekey: "login-loginNewPasswordLabel"
            },
            loginConfirmPasswordLabel: {
                messagekey: "login-loginConfirmPasswordLabel"
            },
            submitNewPassword: {
                messagekey: "login-submitNewPassword"
            }
        },
        selectorsToIgnore: ["loginForm", "signIn", "userID", "password", "requestReset", "loginRequired",
            "enterEmail", "enterEmailForm", "email", "emailRequired",
            "resetRequest", "newPassword", "confirmPassword", "passwordRequired"],
        renderOnInit: true,
        components: {
            messageBar: {
                type: "cspace.messageBar"
            },
            passwordValidator: {
                type: "cspace.passwordValidator"
            }
        },
        invokers: {
            lookupMessage: {
                funcName: "cspace.util.lookupMessage",
                args: ["{login}.options.parentBundle.messageBase", "{arguments}.0"]
            }
        },
        strings: {}, 
        model: {
            otherTenant: "#"
        },
        urls: cspace.componentUrlBuilder({
            passwordreset: "%tenant/%tenantname/passwordreset",
            resetpassword: "%tenant/%tenantname/resetpassword",
            login: "%tenant/%tenantname/login"
        })
    });
    
    cspace.login.finalInit = function (that) {
        bindEventHandlers(that);      
        if (cspace.util.useLocalData()) {
            that.locate("loginForm").attr("action", "createnew.html");
        } else {
            that.locate("loginForm").attr("action", that.options.urls.login);
        }

        var result = cspace.util.getUrlParameter("result");
        if (result === "fail") {
            that.messageBar.show(that.lookupMessage("login-invalid"), null, true);
        } else {
            that.messageBar.hide();
        }
        var resetToken = cspace.util.getUrlParameter("token");
        var email = cspace.util.getUrlParameter("email");
        if (resetToken) {
            that.token = resetToken;
            that.email = email;
            showReset(that.dom);
        } else {
            showSignIn(that.dom);
        }
    };
    
    cspace.login.postInit = function (that) {
        that.submitEmail = function () {
            if (emailFormValid(that.messageBar, that.dom, that.lookupMessage("login-emailRequired"))) {
                submitEmail(that.locate("email").val(), that.options.urls.passwordreset, that);
            }
        };
        that.submitNewPassword = function () {
            if (passwordFormValid(that.messageBar, that.dom, that.lookupMessage("login-allFieldsRequired"), that.lookupMessage("login-passwordsMustMatch"))) {
                submitNewPassword(that.locate("newPassword").val(), that.options.urls.resetpassword, that);
            }
        };
    };
    
})(jQuery, fluid);
