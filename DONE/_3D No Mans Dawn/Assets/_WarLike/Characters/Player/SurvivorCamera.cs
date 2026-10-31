using UnityEngine;

namespace WarLike.NoMansDawn
{
    public sealed class SurvivorCamera : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 shoulderOffset = new Vector3(0.45f, 1.55f, 0f);
        [SerializeField] private float distance = 3.8f;
        [SerializeField] private float sensitivity = 2f;
        [SerializeField] private float minPitch = -55f;
        [SerializeField] private float maxPitch = 70f;
        [SerializeField] private float smoothTime = 0.06f;
        [SerializeField] private LayerMask obstructionMask = ~0;
        private float yaw, pitch;
        private Vector3 smoothVelocity;

        private void Start()
        {
            yaw = transform.eulerAngles.y;
            pitch = transform.eulerAngles.x;
            if (!target) Debug.LogWarning("SurvivorCamera: assign player target in Inspector.", this);
        }

        private void LateUpdate()
        {
            if (!target) return;
            if (Input.GetMouseButtonDown(1)) { Cursor.lockState = CursorLockMode.Locked; Cursor.visible = false; }
            if (Input.GetKeyDown(KeyCode.Escape)) { Cursor.lockState = CursorLockMode.None; Cursor.visible = true; }
            if (Cursor.lockState == CursorLockMode.Locked)
            {
                yaw += Input.GetAxis("Mouse X") * sensitivity;
                pitch = Mathf.Clamp(pitch - Input.GetAxis("Mouse Y") * sensitivity, minPitch, maxPitch);
            }
            Quaternion orientation = Quaternion.Euler(pitch, yaw, 0f);
            Vector3 anchor = target.position + Vector3.up * shoulderOffset.y;
            Vector3 shoulder = orientation * new Vector3(shoulderOffset.x, 0, 0);
            Vector3 origin = anchor + shoulder;
            Vector3 backward = orientation * Vector3.back;
            float actualDistance = distance;
            if (Physics.SphereCast(origin, 0.18f, backward, out RaycastHit hit, distance, obstructionMask, QueryTriggerInteraction.Ignore))
                actualDistance = Mathf.Max(0.3f, hit.distance - 0.15f);
            Vector3 desired = origin + backward * actualDistance;
            transform.position = Vector3.SmoothDamp(transform.position, desired, ref smoothVelocity, smoothTime);
            transform.rotation = orientation;
        }
    }
}
