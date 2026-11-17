document.addEventListener("DOMContentLoaded", () => {
  // عناصر الصفحة
  const loginForm = document.getElementById("loginForm");
  const loginPanel = document.getElementById("loginPanel");
  const dashboardPanel = document.getElementById("dashboardPanel");

  const loginMessage = document.getElementById("loginMessage");
  const dashboardMessage = document.getElementById("dashboardMessage");

  const logoutButton = document.getElementById("logoutButton");
  const refreshButton = document.getElementById("refreshButton");

  const requestsList = document.getElementById("requestsList");
  const requestCount = document.getElementById("requestCount");
  const lastUpdated = document.getElementById("lastUpdated");

  // التأكد من وجود إعدادات Supabase
  const supabaseURL = window.NEXORA_SUPABASE_URL;
  const supabaseKey = window.NEXORA_SUPABASE_KEY;

  if (!window.supabase || !supabaseURL || !supabaseKey) {
    loginMessage.textContent =
      "خطأ: إعدادات Supabase غير موجودة. راجع ملف js/config.js";
    loginMessage.style.color = "red";
    return;
  }

  // إنشاء الاتصال
  const db = window.supabase.createClient(
    supabaseURL,
    supabaseKey
  );

  // إظهار لوحة التحكم أو تسجيل الدخول
  function showDashboard(isLoggedIn) {
    loginPanel.hidden = isLoggedIn;
    dashboardPanel.hidden = !isLoggedIn;
    logoutButton.hidden = !isLoggedIn;
  }

  // عرض رسالة
  function showMessage(element, message, color = "red") {
    element.textContent = message;
    element.style.color = color;
    element.style.display = "block";
  }

  // تحميل الطلبات
  async function loadRequests() {
    dashboardMessage.textContent = "جاري تحميل الطلبات...";
    requestsList.replaceChildren();

    const { data, error } = await db
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showMessage(
        dashboardMessage,
        "تعذر تحميل الطلبات: " + error.message
      );
      return;
    }

    requestCount.textContent = data.length;
    lastUpdated.textContent = new Date().toLocaleTimeString("ar-EG");

    dashboardMessage.textContent = "";

    if (!data.length) {
      requestsList.textContent = "لا توجد طلبات حتى الآن.";
      return;
    }

    data.forEach((request) => {
      const card = document.createElement("article");
      card.className = "request-card";

      const title = document.createElement("h3");
      title.textContent = request.name || "بدون اسم";

      const email = document.createElement("p");
      email.textContent = "البريد: " + (request.email || "غير متوفر");

      const service = document.createElement("p");
      service.textContent = "الخدمة: " + (request.service || "غير محددة");

      const message = document.createElement("p");
      message.textContent = "الرسالة: " + (request.message || "لا توجد رسالة");

      const date = document.createElement("small");
      date.textContent = request.created_at
        ? new Date(request.created_at).toLocaleString("ar-EG")
        : "";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-outline";
      deleteButton.textContent = "حذف الطلب";

      deleteButton.addEventListener("click", async () => {
        if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

        const { error: deleteError } = await db
          .from("contact_requests")
          .delete()
          .eq("id", request.id);

        if (deleteError) {
          showMessage(
            dashboardMessage,
            "تعذر حذف الطلب: " + deleteError.message
          );
          return;
        }

        await loadRequests();
      });

      card.append(title, email, service, message, date, deleteButton);
      requestsList.appendChild(card);
    });
  }

  // تسجيل الدخول
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginMessage.textContent = "جاري تسجيل الدخول...";

    const submitButton = loginForm.querySelector(
      'button[type="submit"]'
    );

    submitButton.disabled = true;

    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showMessage(
          loginMessage,
          "فشل تسجيل الدخول: " + error.message
        );
        return;
      }

      if (!data.session) {
        showMessage(loginMessage, "لم يتم إنشاء جلسة تسجيل دخول.");
        return;
      }

      showMessage(loginMessage, "تم تسجيل الدخول بنجاح", "green");

      showDashboard(true);
      await loadRequests();

    } catch (error) {
      showMessage(
        loginMessage,
        "حدث خطأ غير متوقع: " + error.message
      );
    } finally {
      submitButton.disabled = false;
    }
  });

  // تسجيل الخروج
  logoutButton.addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      showMessage(dashboardMessage, error.message);
      return;
    }

    loginForm.reset();
    loginMessage.textContent = "";
    showDashboard(false);
  });

  // تحديث الطلبات
  refreshButton.addEventListener("click", loadRequests);

  // التحقق من وجود جلسة سابقة
  async function checkSession() {
    const { data, error } = await db.auth.getSession();

    if (error) {
      showMessage(loginMessage, error.message);
      return;
    }

    const loggedIn = Boolean(data.session);

    showDashboard(loggedIn);

    if (loggedIn) {
      await loadRequests();
    }
  }

  checkSession();
});