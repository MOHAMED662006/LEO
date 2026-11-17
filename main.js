// قائمة الهاتف والتفاعلات العامة للموقع
document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  // تحديث سنة حقوق النشر تلقائيًا
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // إظهار العناصر عند الاقتراب منها أثناء التمرير
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("visible"));
  }

  // إرسال طلبات التواصل إلى Supabase
  const contactForm = document.querySelector("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const statusMessage = document.querySelector("#formMessage");
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;

      if (!window.supabase || !window.NEXORA_SUPABASE_URL ||
          !window.NEXORA_SUPABASE_KEY ||
          window.NEXORA_SUPABASE_URL.includes("PASTE_") ||
          window.NEXORA_SUPABASE_KEY.includes("PASTE_")) {
        statusMessage.textContent = "أضف Project URL و Publishable Key في ملف js/config.js أولاً.";
        statusMessage.style.color = "#fbbf24";
        return;
      }

      const formData = new FormData(contactForm);
      const customer = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        service: String(formData.get("service") || "").trim(),
        message: String(formData.get("message") || "").trim()
      };

      if (!customer.name || !customer.email || !customer.service || !customer.message) {
        statusMessage.textContent = "من فضلك أكمل جميع البيانات.";
        statusMessage.style.color = "#ff7777";
        return;
      }

      const supabaseClient = window.supabase.createClient(
        window.NEXORA_SUPABASE_URL,
        window.NEXORA_SUPABASE_KEY
      );

      submitButton.disabled = true;
      submitButton.textContent = "جاري الإرسال...";
      statusMessage.textContent = "";

      try {
        const { error } = await supabaseClient
          .from("contact_requests")
          .insert([customer]);

        if (error) throw error;

        statusMessage.textContent = "تم إرسال طلبك بنجاح! سنتواصل معك قريبًا.";
        statusMessage.style.color = "#6ee7c8";
        contactForm.reset();
      } catch (error) {
        console.error("Supabase contact form error:", error);
        statusMessage.textContent = "تعذر إرسال الطلب. تأكد من إنشاء جدول contact_requests وسياسات RLS ثم حاول مرة أخرى.";
        statusMessage.style.color = "#ff7777";
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
});