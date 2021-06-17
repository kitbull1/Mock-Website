window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", new Date());

gtag("config", "UA-112208093-1");

// <script src="https://authcdn.geeksforgeeks.org/js/typeahead.bundle.min.js"></script>
// set csrf token for login
(function () {
  $.ajax({
    url: "https://auth.geeksforgeeks.org/setLoginToken.php",
    type: "POST",
    xhrFields: {
      withCredentials: true,
    },
    success: function (data) {},
    error: function (data) {
      console.log(data);
    },
  });
})();

$("#loginCaptcha").closest(".modal-form-group").hide();

//google captch initialization for register/forgot section.
var captchaSiteKey = "6LexF0sUAAAAADiQjz9BMiSrqplrItl-tWYDSfWa";
var forgotWidgetId;
var registerWidgetId;
var loginWidgetId;
var onloadCallback = function () {
  // Renders the HTML element with id 'example1' as a reCAPTCHA widget.
  // The id of the reCAPTCHA widget is assigned to 'widgetId1'.
  registerWidgetId = grecaptcha.render("registerCaptcha", {
    sitekey: captchaSiteKey,
  });
  loginWidgetId = grecaptcha.render("loginCaptcha", {
    sitekey: captchaSiteKey,
  });
  forgotWidgetId = grecaptcha.render("forgotCaptcha", {
    sitekey: captchaSiteKey,
  });
};

// check required field.
$("body").on("blur", "input[required=required]", function () {
  var val = $(this).val();
  $(".error-focus").removeClass("error-focus");
  $("div.input-error").remove();
  if (val == "" || val == null || val == undefined) {
    $(this)
      .closest(".modal-form-group")
      .append('<div class="input-error">Field can not be empty.</div>');
    $(this).addClass("error-focus");
    $(this).focus();
  }
});

//remove error message if input have some words.
$("body").on("keydown", "input[required=required]", function () {
  var val = $(this).val();
  if (val != "" || val != null || val != undefined) {
    $(this).removeClass("error-focus");
    $(this).closest(".modal-form-group").find(".input-error").remove();
  }
});

// suggest organization.
var instituteListBlood = new Bloodhound({
  initialize: false,
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  sufficient: 5,
  prefetch: {
    url: "https://api.geeksforgeeks.org/api/institutes/all",
  },
  remote: {
    url: "https://api.geeksforgeeks.org/api/institutes/%QUERY/all",
    wildcard: "%QUERY",
    filter: function (data) {
      instituteListBlood.add(data);
      return data;
    },
  },
});

$(document).ready(function () {
  instituteListBlood.clearPrefetchCache();
  instituteListBlood.initialize();
  $("input.typeahead").typeahead(
    {
      minLength: 2,
      dynamic: false,
      highlight: true,
      cache: "sessionStorage",
      searchOnfocus: true,
      offset: true,
      blurOnTab: true,
    },
    {
      displaykey: "value",
      limit: 15,
      source: instituteListBlood.ttAdapter(),
      accent: true,
      templates: {
        empty: [""].join("\n"),
      },
    }
  );
});

$(document).ready(function () {
  // dismiss modal when click on close icon.
  /*$('body').on('click', '.close', function(){
          $(this).closest('.login-modal-div').fadeOut('fast');
        });*/

  //toggle between forgot div and login div.
  $("body").on("click", ".login-link, .forgot-link", function () {
    if ($(this).hasClass("login-link")) {
      $(".forgot-div").slideUp();
      $(".login-register-div").slideDown();
    } else {
      $(".login-register-div").slideUp();
      $(".forgot-div").slideDown();
    }
  });

  // redirect function.
  function redirect(where) {
    if (where == "to") {
      window.location.href = to;
    } else if (where == "reset") {
      q2to3();
      $("#ruser").val($("#fuser").val());
    } else {
      if (window.location.href == where) {
        window.location.reload(true);
      } else {
        window.location.href = where;
      }
    }
  }

  // event on submit either login, register or forgot form.
  $(".login-form").submit(function (e) {
    e.preventDefault();
    this1 = $(this);
    $(".spinner-loading-overlay").show();
    this1.find(".extra").empty();
    this1.find("input[type=submit]").attr("disabled", true);
    var browserInfo = fetchBrowserInfo();

    $.ajax({
      type: "POST",
      url: "https://auth.geeksforgeeks.org/auth.php",
      data: $(this).serialize() + "&browserInfo=" + JSON.stringify(browserInfo),
      dataType: "json",
      success: function (data) {
        this1.find("input[type=submit]").attr("disabled", false);
        if (data.redirect) {
          redirect(data.redirect);
        } else if (data.extra) {
          $(".spinner-loading-overlay").hide();
          this1.find(".extra").append(data.extra);
          var errorTxt = this1.find(".extra").find("div").text().trim();
          grecaptcha.reset(loginWidgetId);
          if (
            errorTxt == "Captcha validation needed" &&
            this1.attr("id") == "Login"
          ) {
            if (
              !$("#loginCaptcha")
                .closest(".modal-form-group")
                .find("input[name=recaptchaShow]").length
            ) {
              $("#loginCaptcha")
                .closest(".modal-form-group")
                .append('<input name="recaptchaShow" type="hidden" value="1">');
            }
            $("#loginCaptcha").closest(".modal-form-group").show();
          }
        }
      },
      error: function (jqXHR, exception, errorThrown) {
        this1.find("input[type=submit]").attr("disabled", false);
        $(".spinner-loading-overlay").hide();
        console.log("An error occurred");
      },
      complete: function () {
        this1.find("input[type=submit]").attr("disabled", false);
        if (this1.attr("id") == "Forgot") {
          grecaptcha.reset(forgotWidgetId);
        } else {
          grecaptcha.reset(registerWidgetId);
        }
      },
    });
    return false;
  });

  //prevent to type space bar in register password field.
  $("body").on("keydown", "input[name=pass]", function (e) {
    if (
      $(this).closest("form").find("input[name=reqType]").length &&
      $(this).closest("form").find("input[name=reqType]").val() == "Register"
    ) {
      return e.which !== 32;
    }
  });
});

// facebook login
$("#fblogin").click(function (e) {
  e.preventDefault();
  var w = 600,
    h = 350,
    left = screen.width / 2 - w / 2,
    top = screen.height / 2 - h / 2;
  var remember = $("#Login").find("input[name=rem]").is(":checked");
  var redirect = $("#Login").find("input[name=to]").val();
  var browserInfo = JSON.stringify(fetchBrowserInfo());
  window.open(
    "https://auth.geeksforgeeks.org/fb-login.php?to=" +
      redirect +
      "&rem=" +
      remember +
      "&browserInfo=" +
      browserInfo,
    "_self",
    "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
      w +
      ", height=" +
      h +
      ",top=" +
      top +
      ", left=" +
      left
  );
});

// linkedin login
$("#inlogin").click(function (e) {
  e.preventDefault();
  var w = 600,
    h = 350,
    left = screen.width / 2 - w / 2,
    top = screen.height / 2 - h / 2;
  var remember = $("#Login").find("input[name=rem]").is(":checked");
  var redirect = $("#Login").find("input[name=to]").val();
  var browserInfo = JSON.stringify(fetchBrowserInfo());
  window.open(
    "https://auth.geeksforgeeks.org/linkedin-login.php?to=" +
      redirect +
      "&rem=" +
      remember +
      "&browserInfo=" +
      browserInfo,
    "_self",
    "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
      w +
      ", height=" +
      h +
      ",top=" +
      top +
      ", left=" +
      left
  );
});

// GitHub login
$("#gitlogin").click(function (e) {
  e.preventDefault();
  var w = 600,
    h = 350,
    left = screen.width / 2 - w / 2,
    top = screen.height / 2 - h / 2;
  var remember = $("#Login").find("input[name=rem]").is(":checked");
  var redirect = $("#Login").find("input[name=to]").val();
  var browserInfo = JSON.stringify(fetchBrowserInfo());
  window.open(
    "https://auth.geeksforgeeks.org/github-login.php?to=" +
      redirect +
      "&rem=" +
      remember +
      "&browserInfo=" +
      browserInfo,
    "_self",
    "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
      w +
      ", height=" +
      h +
      ",top=" +
      top +
      ", left=" +
      left
  );
});

// Google login
gapi.load("auth2", initSigninV2);

function initSigninV2() {
  auth2 = gapi.auth2.init({
    client_id:
      "388036620207-3uolk1hv6ta7p3r9l6s3bobifh086qe1.apps.googleusercontent.com",
    cookiepolicy: "single_host_origin",
  });
  attachSignin(document.getElementById("glogin"));
}

function attachSignin(element) {
  var redirect = $("#Login").find("input[name=to]").val();
  var browserInfo = fetchBrowserInfo();
  auth2.attachClickHandler(
    element,
    {},
    function (googleUser) {
      $(".spinner-loading-overlay").show();
      var id_token = googleUser.getAuthResponse().id_token;
      var remember = $("#Login").find("input[name=rem]").is(":checked");
      $.ajax({
        url: "https://auth.geeksforgeeks.org/oauth/google.php",
        data: {
          id: id_token,
          redirect: redirect,
          remember: remember,
          browserInfo: browserInfo,
        },
        dataType: "json",
        success: function (data) {
          if (data.redirect) {
            if (window.location.href == data.redirect) {
              window.location.reload(true);
            } else {
              window.location.href = data.redirect;
            }
          } else if (data.extra) {
            $("#extra").append(data.extra);
            $("html, body").animate(
              {
                scrollTop: $("#extra").offset().top,
              },
              2000
            );
          } else {
            console.log(data);
          }
        },
      });
    },
    function (error) {
      $(".spinner-loading-overlay").hide();
      console.log(JSON.stringify(error, undefined, 2));
    }
  );
}

function fetchBrowserInfo() {
  var browserInfo = {};
  browserInfo.appName = navigator.appName;
  browserInfo.appCodeName = navigator.appCodeName;
  browserInfo.cookieEnable = navigator.cookieEnabled;
  browserInfo.prodName = navigator.product;
  browserInfo.appVersion = navigator.appVersion;
  browserInfo.appOs = navigator.platform;
  browserInfo.appLang = navigator.language;
  browserInfo.vendorName = navigator.vendor;
  browserInfo.loginDomain = "auth";

  return browserInfo;
}
