<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendOTPNotification extends Notification
{
    use Queueable;

    protected $otp;
    protected $type;

    /**
     * Create a new notification instance.
     */
    public function __construct($otp, $type = 'verification')
    {
        $this->otp = $otp;
        $this->type = $type;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->type === 'verification' ? 'Verifikasi Email Akun Radencak Shop' : 'Reset Kata Sandi Radencak Shop';
        $greeting = $this->type === 'verification' ? 'Selamat Datang!' : 'Halo!';
        $intro = $this->type === 'verification' 
            ? 'Gunakan kode OTP di bawah ini untuk memverifikasi alamat email Anda.' 
            : 'Kami menerima permintaan untuk mengatur ulang kata sandi Anda. Gunakan kode OTP di bawah ini untuk melanjutkan.';

        return (new MailMessage)
            ->subject($subject)
            ->greeting($greeting)
            ->line($intro)
            ->line('Kode OTP Anda adalah:')
            ->line('**' . $this->otp . '**')
            ->line('Kode ini berlaku selama 10 menit.')
            ->line('Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
