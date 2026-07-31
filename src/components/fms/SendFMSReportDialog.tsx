import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Paperclip, X } from 'lucide-react';
import { generateFMSReportPdf } from '../../lib/fmsReport/pdf';
import type { FMSReportModel } from '../../lib/fmsReport/types';
import { buildDefaultEmailContent, sendFMSReportEmail } from '../../lib/fmsReportEmail';

const emailFormSchema = z.object({
  recipientEmail: z.string().min(1, 'A címzett megadása kötelező').email('Érvénytelen e-mail cím'),
  recipientName: z.string().min(1, 'A címzett neve kötelező'),
  subject: z.string().min(1, 'A tárgy megadása kötelező'),
  bodyText: z.string().min(1, 'A levélszöveg megadása kötelező'),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface SendFMSReportDialogProps {
  open: boolean;
  onClose: () => void;
  model: FMSReportModel;
}

export function SendFMSReportDialog({ open, onClose, model }: SendFMSReportDialogProps) {
  const [isSending, setIsSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
  });

  // Megnyitáskor újratöltjük az alapértelmezéseket (más felmérésre válthattak).
  useEffect(() => {
    if (!open) return;

    const defaults = buildDefaultEmailContent(model);
    reset({
      recipientEmail: model.clientEmail ?? '',
      recipientName: model.clientName,
      subject: defaults.subject,
      bodyText: defaults.bodyText,
    });
  }, [open, model, reset]);

  const onSubmit = async (values: EmailFormValues) => {
    try {
      setIsSending(true);

      const pdf = await generateFMSReportPdf(model);

      await sendFMSReportEmail({
        recipientEmail: values.recipientEmail,
        recipientName: values.recipientName,
        subject: values.subject,
        bodyText: values.bodyText,
        pdfBase64: pdf.base64,
        filename: pdf.filename,
      });

      toast.success('A riport elküldve.');
      onClose();
    } catch (error) {
      console.error('Failed to send FMS report:', error);
      toast.error(error instanceof Error ? error.message : 'Az e-mail küldése sikertelen.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isSending ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                      <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Riport küldése e-mailben
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      A felmérés PDF csatolmányként megy ki.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSending}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700"
                    aria-label="Bezárás"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="recipientName" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Címzett neve</label>
                      <input id="recipientName" type="text" className="input" {...register('recipientName')} />
                      {errors.recipientName && (
                        <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                          {errors.recipientName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="recipientEmail" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Címzett e-mail címe</label>
                      <input
                        id="recipientEmail"
                        type="email"
                        className="input"
                        placeholder="ugyfel@example.com"
                        {...register('recipientEmail')}
                      />
                      {errors.recipientEmail && (
                        <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                          {errors.recipientEmail.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Tárgy</label>
                    <input id="subject" type="text" className="input" {...register('subject')} />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bodyText" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Levélszöveg</label>
                    <textarea id="bodyText" rows={10} className="input" {...register('bodyText')} />
                    {errors.bodyText && (
                      <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.bodyText.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-700/40 dark:text-gray-400">
                    <Paperclip className="h-4 w-4 shrink-0" />
                    <span>A generált PDF riport automatikusan csatolásra kerül.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} disabled={isSending} className="btn btn-outline">
                      Mégse
                    </button>
                    <button type="submit" disabled={isSending} className="btn btn-primary">
                      {isSending ? 'Küldés...' : 'Küldés'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default SendFMSReportDialog;
