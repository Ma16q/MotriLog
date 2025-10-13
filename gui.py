import tkinter as tk
from tkinter import filedialog, messagebox
import shutil
import os

FILE_TYPES = {
    "PDF": [("PDF files", "*.pdf")],
    "Image": [("Image files", "*.png;*.jpg;*.jpeg;*.gif;*.bmp")],
    "Word": [("Word documents", "*.doc;*.docx")],
    "PowerPoint": [("PowerPoint files", "*.ppt;*.pptx")]
}


class FileUploaderApp:
    def __init__(self, root):
        self.root = root
        self.root.title("File Uploader")
        self.root.geometry("520x470")
        self.root.resizable(False, False)

        self.file_path = None
        self.save_path = None
        self.selected_type = tk.StringVar(value="PDF")
        self.office_confirmed = tk.BooleanVar(value=False)
        self.dark_mode = tk.BooleanVar(value=False)

        # Light/Dark Mode Toggle
        self.theme_button = tk.Button(root, text="🌙", font=("Arial", 12), command=self.toggle_theme, bd=0)
        self.theme_button.place(x=470, y=10)

        self.light_colors = {
            "bg": "#ffffff",
            "fg": "#000000",
            "highlight": "#0078d7",
            "alert_bg": "#fff3cd",
            "alert_fg": "#856404",
        }

        self.dark_colors = {
            "bg": "#2e2e2e",
            "fg": "#f5f5f5",
            "highlight": "#4a90e2",
            "alert_bg": "#3b3b1f",
            "alert_fg": "#d4c25b",
        }

        self.current_theme = self.light_colors
        self.root.configure(bg=self.current_theme["bg"])

        # UI Elements
        self.title_label = tk.Label(root, text="Upload a File", font=("Arial", 16, "bold"))
        self.title_label.pack(pady=10)

        self.subtitle_label = tk.Label(
            root,
            text="Choose one of the file types below and upload the matching file.",
            wraplength=450,
            justify="center",
            font=("Arial", 10)
        )
        self.subtitle_label.pack(pady=5)

        # File type radio buttons
        self.radio_frame = tk.Frame(root)
        self.radio_frame.pack(pady=5)
        for file_type in FILE_TYPES.keys():
            tk.Radiobutton(
                self.radio_frame,
                text=file_type,
                variable=self.selected_type,
                value=file_type,
                command=self.on_type_change
            ).pack(anchor="w", padx=40)

        # Office 365 confirmation (hidden by default)
        self.office_frame = tk.Frame(root, bd=2, relief="groove")
        self.office_label = tk.Label(
            self.office_frame,
            text="Special case (Required Office 365)",
            font=("Arial", 10, "bold")
        )
        self.office_label.pack(pady=(5, 2))
        tk.Checkbutton(
            self.office_frame,
            text="I confirm I have Office 365",
            variable=self.office_confirmed
        ).pack(pady=(0, 5))
        self.office_frame.pack_forget()

        # Choose file
        tk.Button(root, text="Choose File", command=self.choose_file, width=20).pack(pady=10)
        self.file_label = tk.Label(root, text="No file selected", fg="gray")
        self.file_label.pack()

        # Choose save path
        tk.Button(root, text="Choose Save Path", command=self.choose_save_path, width=20).pack(pady=10)
        self.save_path_label = tk.Label(root, text="No save path selected", fg="gray")
        self.save_path_label.pack()

        # Upload and Reset
        self.upload_button = tk.Button(root, text="Upload", command=self.upload_file, width=15)
        self.upload_button.pack(pady=10)
        tk.Button(root, text="Reset", command=self.reset, width=10).pack()

        self.apply_theme()

    def toggle_theme(self):
        """Switch between light and dark mode"""
        self.dark_mode.set(not self.dark_mode.get())
        self.current_theme = self.dark_colors if self.dark_mode.get() else self.light_colors
        self.theme_button.config(text="☀️" if self.dark_mode.get() else "🌙")
        self.apply_theme()

    def apply_theme(self):
        """Apply color scheme to all widgets"""
        c = self.current_theme
        self.root.configure(bg=c["bg"])
        for widget in self.root.winfo_children():
            try:
                widget.configure(bg=c["bg"], fg=c["fg"])
            except tk.TclError:
                pass

        self.title_label.configure(bg=c["bg"], fg=c["fg"])
        self.subtitle_label.configure(bg=c["bg"], fg=c["fg"])
        self.radio_frame.configure(bg=c["bg"])

        for rb in self.radio_frame.winfo_children():
            try:
                rb.configure(bg=c["bg"], fg=c["fg"], activeforeground=c["highlight"])
                if "selectcolor" in rb.keys():
                    rb.configure(selectcolor=c["bg"])
            except tk.TclError:
                pass

        # Office frame
        self.office_frame.configure(bg=c["alert_bg"])
        self.office_label.configure(bg=c["alert_bg"], fg=c["alert_fg"])
        for cb in self.office_frame.winfo_children():
            try:
                cb.configure(bg=c["alert_bg"], fg=c["alert_fg"])
                if "selectcolor" in cb.keys():
                    cb.configure(selectcolor=c["alert_bg"])
            except tk.TclError:
                pass

        self.file_label.configure(bg=c["bg"], fg="gray")
        self.save_path_label.configure(bg=c["bg"], fg="gray")
        self.upload_button.configure(bg=c["highlight"], fg="white", activebackground=c["highlight"])

    def on_type_change(self):
        """Show Office 365 message for Word/PPT"""
        t = self.selected_type.get()
        if t in ("Word", "PowerPoint"):
            self.office_frame.pack(pady=10, padx=40, fill="x")
        else:
            self.office_frame.pack_forget()
            self.office_confirmed.set(False)

    def choose_file(self):
        """Select a file"""
        t = self.selected_type.get()
        file_path = filedialog.askopenfilename(filetypes=FILE_TYPES[t])
        if file_path:
            self.file_path = file_path
            self.file_label.config(text=os.path.basename(file_path), fg=self.current_theme["fg"])
        else:
            self.file_label.config(text="No file selected", fg="gray")

    def choose_save_path(self):
        """Select save folder"""
        folder = filedialog.askdirectory(title="Choose where to save the file")
        if folder:
            self.save_path = folder
            self.save_path_label.config(text=folder, fg=self.current_theme["fg"])
        else:
            self.save_path_label.config(text="No save path selected", fg="gray")

    def upload_file(self):
        """Copy file to chosen save location (no conversion)"""
        if not self.file_path:
            messagebox.showerror("Error", "Please choose a file first.")
            return
        if not self.save_path:
            messagebox.showerror("Error", "Please choose where to save the file.")
            return
        if self.selected_type.get() in ("Word", "PowerPoint") and not self.office_confirmed.get():
            messagebox.showerror("Error", "You must confirm you have Office 365.")
            return

        filename = os.path.basename(self.file_path)
        dest = os.path.join(self.save_path, filename)

        # Prevent copying file to same location
        if os.path.abspath(self.file_path) == os.path.abspath(dest):
            messagebox.showwarning("Warning", "File already exists in the selected folder.")
            return

        try:
            shutil.copy(self.file_path, dest)
            messagebox.showinfo("Upload Successful", f"File saved to:\n{dest}")
            self.reset()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save file:\n{e}")

    def reset(self):
        """Reset all fields"""
        self.file_path = None
        self.save_path = None
        self.file_label.config(text="No file selected", fg="gray")
        self.save_path_label.config(text="No save path selected", fg="gray")
        self.office_confirmed.set(False)
        self.selected_type.set("PDF")
        self.on_type_change()


if __name__ == "__main__":
    root = tk.Tk()
    app = FileUploaderApp(root)
    root.mainloop()
