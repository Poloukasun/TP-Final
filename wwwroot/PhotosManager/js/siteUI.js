let contentScrollPosition = 0;
let loginMessage, Email, EmailError, passwordError;
resetErrorMessages();
let loggedUser = API.retrieveLoggedUser();
Init_UI();

function Init_UI() {
    renderHeader();
    if (loggedUser) {
        if (loggedUser.VerifyCode == "verified") {
            renderPhotos();
        } else {
            renderVerification();
        }
    } else {
        renderLoginForm();
    }
}

function renderVerification() {
    updateHeader('Vérification', '#actionTitle');
    loginMessage = 'Veuillez entrer le code de vérification que vous avez reçu par courriel';
    eraseContent();
    $("#content").append(
        $(`
        <div class="content" style="text-align:center">
        <form class="form" id="verifyForm">
        <b>${loginMessage}</b>
        <input type='text'
        name='code'
        placeholder='Code de vérification de courriel'
        class="form-control"
        required
        RequireMessage = 'Veuillez entrer votre code de vérification'>
        <span style='color:red'>${passwordError}</span>
        <input type='submit' name='submit' value="Vérifier" class="form-control btn-primary">
        </form>
        </div>
    `));

    $('#verifyForm').on('submit', function (e) {
        let form = getFormData($('#verifyForm'));
        showWaitingGif();
        e.preventDefault();
        API.verifyEmail(loggedUser.Id, form.code).then(r => {
            if (r) {
                loggedUser = API.retrieveLoggedUser();
                renderPhotos();
            }
        });
        passwordError = "Code de vérification invalide";
        renderVerification();
        resetErrorMessages();
    })

}

async function renderPhotos() {
    showWaitingGif();
    updateHeader("Liste des photos", "#actionTitle");
    // $("#createPhoto").show();
    // let contacts = null;
    eraseContent();
    // if (contacts !== null) {
    //     contacts.forEach(contact => {
    //         $("#content").append(renderContact(contact));
    //     });
    //     restoreContentScrollPosition();
    //     // Attached click events on command icons
    //     $(".editCmd").on("click", function () {
    //         saveContentScrollPosition();
    //         renderEditContactForm($(this).attr("editContactId"));
    //     });
    //     $(".deleteCmd").on("click", function () {
    //         saveContentScrollPosition();
    //         renderDeleteContactForm($(this).attr("deleteContactId"));
    //     });
    //     $(".contactRow").on("click", function (e) { e.preventDefault(); })
    // } else {
    //     renderError("Service introuvable");
    // }
}

function renderCreateProfil() {
    noTimeout(); // ne pas limiter le temps d’inactivité
    eraseContent(); // effacer le conteneur #content
    updateHeader("Inscription", "#actionTitle"); // mettre à jour l’entête et menu
    // $("#createPhoto").hide();
    // $("#abort").hide();
    $("#newPhotoCmd").hide(); // camouffler l’icone de commande d’ajout de photo
    $("#content").append(`
    <form class="form" id="createProfilForm"'>
    <fieldset>
    <legend>Adresse ce courriel</legend>
    <input type="email"
    class="form-control Email"
    name="Email"
    id="Email"
    placeholder="Courriel"
    required
    RequireMessage = 'Veuillez entrer votre courriel'
    InvalidMessage = 'Courriel invalide'
    CustomErrorMessage ="Ce courriel est déjà utilisé"/>
    <input class="form-control MatchedInput"
    type="text"
    matchedInputId="Email"
    name="matchedEmail"
    id="matchedEmail"
    placeholder="Vérification"
    required
    RequireMessage = 'Veuillez entrez de nouveau votre courriel'
    InvalidMessage="Les courriels ne correspondent pas" />
    </fieldset>
    <fieldset>
    <legend>Mot de passe</legend>
    <input type="password"
    class="form-control"
    name="Password"
    id="Password"
    placeholder="Mot de passe"
    required
    RequireMessage = 'Veuillez entrer un mot de passe'
    InvalidMessage = 'Mot de passe trop court'/>
    <input class="form-control MatchedInput"
    type="password"
    matchedInputId="Password"
    name="matchedPassword"
    id="matchedPassword"
    placeholder="Vérification" required
    InvalidMessage="Ne correspond pas au mot de passe" />
    </fieldset>
    <fieldset>
    <legend>Nom</legend>
    <input type="text"
    class="form-control Alpha"
    name="Name"
    id="Name"
    placeholder="Nom"
    required
    RequireMessage = 'Veuillez entrer votre nom'
    InvalidMessage = 'Nom invalide'/>
    </fieldset>
    <fieldset>
    <legend>Avatar</legend>
    <div class='imageUploader'
    newImage='true'
    controlId='Avatar'
    imageSrc='images/no-avatar.png'
    waitingImage="images/Loading_icon.gif">
    </div>
    </fieldset>
    <input type='submit' name='submit' id='saveUserCmd' value="Enregistrer" class="form-control btn-primary">
    </form>
    <div class="cancel">
    <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
    </div>`);
    $('#loginCmd').on('click', renderLoginForm); // call back sur clic
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', renderLoginForm); // call back sur clic
    // ajouter le mécanisme de vérification de doublon de courriel
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    // call back la soumission du formulaire
    $('#createProfilForm').on("submit", function (event) {
        let profil = getFormData($('#createProfilForm'));
        delete profil.matchedPassword;
        delete profil.matchedEmail;
        event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        createProfil(profil); // commander la création au service API
    });
}

function createProfil(profil) {
    let result = API.register(profil);
    if (result) {
        loginMessage = "Votre compte a été créé. Veuillez prendre vos courriels pour récupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion.";
        renderLoginForm();
    }
    else {
        // renderError("Une erreur est survenue! ");
    }
}

function editProfil(profil) {
    API.modifyUserProfil(profil).then(r => {
        if (r) {
            modifiedUser = API.retrieveLoggedUser();
            if (loggedUser.Email !== modifiedUser.Email) {
                loggedUser = modifiedUser;
                renderVerification();
            } else {
                loggedUser = modifiedUser;
                renderPhotos();
            }
        } else {
            // renderError("Une erreur est survenue!");
        }
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderLoginForm() {
    updateHeader("Connexion", "#actionTitle"); // mettre à jour l’entête et menu
    // $("#createPhoto").hide();
    // $("#abort").hide();
    $("#newPhotoCmd").hide();
    eraseContent();
    $("#content").append(
        $(`
        <h3>${loginMessage}</h3>
        <form class="form" id="loginForm">
        <input type='email'
        name='Email'
        class="form-control"
        required
        RequireMessage = 'Veuillez entrer votre courriel'
        InvalidMessage = 'Courriel invalide'
        placeholder="adresse de courriel"
        value='${Email}'>
        <span style='color:red'>${EmailError}</span>
        <input type='password'
        name='Password'
        placeholder='Mot de passe'
        class="form-control"
        required
        RequireMessage = 'Veuillez entrer votre mot de passe'>
        <span style='color:red'>${passwordError}</span>
        <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
        </form>
        <div class="form">
        <hr>
        <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
        </div>
        `));
    $('#loginForm').on("submit", function (event) {
        let user = getFormData($('#loginForm'));
        event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        API.login(user.Email, user.Password).then(r => {
            if (r) {
                loggedUser = API.retrieveLoggedUser();
                Init_UI();
            } else {
                switch (API.currentStatus) {
                    case 481:
                        EmailError = "Courriel introuvable";
                        break;
                    case 482:
                        passwordError = "Mot de passe incorrect";
                        break;
                    case 404:
                        // SERVEUR NE RÉPOND PAS
                        break;
                }
                renderLoginForm();
                resetErrorMessages();
            }
        });
    });

    $("#createProfilCmd").on("click", function () {
        renderCreateProfil();
    });
}

function resetErrorMessages() {
    [loginMessage, Email, EmailError, passwordError] = ['', '', '', ''];
}

function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function updateHeader(text, id) {
    $(id).text(text);
    if (!loggedUser) {
        $(".UserAvatarSmall").css("background-image", "none");
        $(".dropdown-menu").html(
            $(`
            <div class="dropdown-item" id="loginCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" id="aboutCmd">
                <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
            </div>
            `)
        );
        $('#loginCmd').on('click', renderLoginForm);
    } else if (loggedUser.VerifyCode == "verified") {
        $(".UserAvatarSmall").css("background-image", `url(${loggedUser.Avatar})`);
        $(".dropdown-menu").html(
            $(`
            ${loggedUser.Authorizations.readAccess == 2 ? `
            <span class="dropdown-item" id="manageUserCm">
                <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers
            </span>
            <div class="dropdown-divider"></div>
            ` : ''}
            <div class="dropdown-item" id="logoutCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Déconnexion
            </div>
            <div class="dropdown-item" id="editCmd">
                <i class="menuIcon fa fa-user-pen mx-2"></i> Modifier votre profil
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" id="listPhotoCmd">
                <i class="menuIcon fa fa-image mx-2"></i> Liste des photos
            </div>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="sortByDateCmd">
                <i class="menuIcon fa fa-check mx-2"></i>
                <i class="menuIcon fa fa-calendar mx-2"></i> Photos par date de création
            </span>
            <span class="dropdown-item" id="sortByOwnersCmd">
                <i class="menuIcon fa fa-fw mx-2"></i>
                <i class="menuIcon fa fa-users mx-2"></i> Photos par créateur
            </span>
            <span class="dropdown-item" id="sortByLikesCmd">
                <i class="menuIcon fa fa-fw mx-2"></i>
                <i class="menuIcon fa fa-user mx-2"></i> Photos les plus aiméés
            </span>
            <span class="dropdown-item" id="ownerOnlyCmd">
                <i class="menuIcon fa fa-fw mx-2"></i>
                <i class="menuIcon fa fa-user mx-2"></i> Mes photos
            </span>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" id="aboutCmd">
                <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
            </div>
            `)
        );
        $('#manageUserCm').on('click', () => {
            renderGestionUsager();
        });
        $('#editCmd').on('click', () => {
            renderEdit();
        })
        $('#logoutCmd').on('click', () => {
            showWaitingGif();
            API.logout().then(r => {
                if (r) {
                    loggedUser = null;
                    renderLoginForm();
                }
            });
        });
        $('#listPhotoCmd').on('click', () => {
            renderPhotos();
        })
    } else {
        $(".UserAvatarSmall").css("background-image", `url(${loggedUser.Avatar})`);
        $(".dropdown-menu").html(
            $(`
            <div class="dropdown-item" id="logoutCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Déconnexion
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" id="aboutCmd">
                <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
            </div>
            `)
        );
        $('#logoutCmd').on('click', logout);
    }
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}
async function renderGestionUsager() {
    showWaitingGif();
    updateHeader("Gestion des usagers", "#actionTitle");
    eraseContent();

    API.GetAccounts().then(r => {
        console.log(r.data);
        if (r) {
            r.data.forEach(u => {
                if (u.Id != loggedUser.Id) {

                    // todo //

                    $("#content").append(
                        $(`
                        <div class="UserRow">
                            <div class="UserContainer noselect">
                                <div class="UserLayout">
                                    <div class="UserAvatar" style="background-image:url('${u.Avatar}')"></div>
                                    <div class="UserInfo">
                                        <span class="UserName">${u.Name}</span>
                                        <a href="mailto:${u.Email}" class="UserEmail">${u.Email}</a>
                                    </div>
                                </div>
                                <div class="UserCommandPanel">
                                    <span class="cmdIconVisible fas fa-user-alt dodgerblueCmd"> </span>
                                    <span class="cmdIconVisible fa-regular fa-circle greenCmd"></span>
                                    <span class="cmdIconVisible fas fa-user-slash goldenrodCmd"></span>
                                </div>
                            </div>
                        </div>`
                        )
                    );
                }
            });
        }
    });
}

function logout() {
    showWaitingGif();
    API.logout().then(r => {
        if (r) {
            loggedUser = null;
            renderLoginForm();
        }
    });
}

function renderEdit() {
    eraseContent();
    updateHeader('Profil', '#actionTitle');
    $('#content').append(
        $(`
        <form class="form" id="editProfilForm"'>
        <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}"/>
        <input type="hidden" name="VerifyCode" id="VerifyCode" value="${loggedUser.VerifyCode}"/>
        <fieldset>
        <legend>Adresse ce courriel</legend>
        <input type="email"
        class="form-control Email"
        name="Email"
        id="Email"
        placeholder="Courriel"
        required
        RequireMessage = 'Veuillez entrer votre courriel'
        InvalidMessage = 'Courriel invalide'
        CustomErrorMessage ="Ce courriel est déjà utilisé"
        value="${loggedUser.Email}" >
        <input class="form-control MatchedInput"
        type="text"
        matchedInputId="Email"
        name="matchedEmail"
        id="matchedEmail"
        placeholder="Vérification"
        required
        RequireMessage = 'Veuillez entrez de nouveau votre courriel'
        InvalidMessage="Les courriels ne correspondent pas"
        value="${loggedUser.Email}" >
        </fieldset>
        <fieldset>
        <legend>Mot de passe</legend>
        <input type="password"
        class="form-control"
        name="Password"
        id="Password"
        placeholder="Mot de passe"
        InvalidMessage = 'Mot de passe trop court' >
        <input class="form-control MatchedInput"
        type="password"
        matchedInputId="Password"
        name="matchedPassword"
        id="matchedPassword"
        placeholder="Vérification"
        InvalidMessage="Ne correspond pas au mot de passe" >
        </fieldset>
        <fieldset>
        <legend>Nom</legend>
        <input type="text"
        class="form-control Alpha"
        name="Name"
        id="Name"
        placeholder="Nom"
        required
        RequireMessage = 'Veuillez entrer votre nom'
        InvalidMessage = 'Nom invalide'
        value="${loggedUser.Name}" >
        </fieldset>
        <fieldset>
        <legend>Avatar</legend>
        <div class='imageUploader'
        newImage='false'
        controlId='Avatar'
        imageSrc='${loggedUser.Avatar}'
        waitingImage="images/Loading_icon.gif">
        </div>
        </fieldset>
        <input type='submit'
        name='submit'
        id='saveUserCmd'
        value="Enregistrer"
        class="form-control btn-primary">
        </form>
        <div class="cancel">
        <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
        <div class="cancel"> <hr>
        <button class="form-control btn-warning" id="confirmDeleteProfil">Effacer le compte</button>
        </div>
        `)
    );
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', renderPhotos); // call back sur clic
    // ajouter le mécanisme de vérification de doublon de courriel
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    // call back la soumission du formulaire
    $('#editProfilForm').on("submit", function (event) {
        let profil = getFormData($('#editProfilForm'));
        delete profil.matchedPassword;
        delete profil.matchedEmail;
        event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        editProfil(profil);
    });
    $("#confirmDeleteProfil").on("click", function (e) {
        e.preventDefault();
        showWaitingGif();
        renderConfirmDeleteProfil();
    });
}

function renderConfirmDeleteProfil() {
    updateHeader("Retrait de compte", "#actionTitle");
    eraseContent();
    $("#content").append(
        $(`
        <br>
        <h3 style="text-align:center;">Voulez-vous vraiment effacer votre compte?</h3>
        <form class="form" id="editProfilForm"'>
        <input type='submit' name='submit' value="Effacer mon compte" class="form-control deleteAccount">
        </form>
        <div class="cancel">
        <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
        `)
    );
    $('#editProfilForm').on('submit', function (e) {
        e.preventDefault();
        showWaitingGif();
        deleteAccount(loggedUser.Id);
    });
    $('#abortCmd').on('click', renderLoginForm); // call back sur clic
}

function deleteAccount(userId) {
    API.unsubscribeAccount(userId).then(r => {
        if (r) {
            logout();
        }
    });
}

function renderHeader() {
    $("#header").html(
        $(`
            <img src="favicon.ico" class="appLogo" alt="" title="Connexion">
                <h4 id="actionTitle">Connexion</h4>
                <!--
                <i class="cmdIcon fa fa-plus" id="createPhoto" title="Ajouter une photo"></i>
                <i class="cmdIcon fa fa-times" id="abort" title="Annuler""></i>
                -->
                <div class="UserAvatarSmall"></div>
                <div class="dropdown ms-auto">
                    <div data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                    </div>
                    <div class="dropdown-menu noselect"></div>
                </div>
        `));
}
function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    updateHeader("À propos...", "#actionTitle");

    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de photos</h2>
                <hr>
                <p>
                    Petite application de gestion de photos multiusagers à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Jean-Sébastien Labrie
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
