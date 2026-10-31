using UnityEngine;

namespace WarLike.NoMansDawn
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class SurvivorMotor : MonoBehaviour
    {
        [Header("Locomotion")]
        [SerializeField, Min(0.1f)] private float walkSpeed = 3.2f;
        [SerializeField, Min(0.1f)] private float sprintSpeed = 5.5f;
        [SerializeField, Min(0.1f)] private float crouchSpeed = 1.65f;
        [SerializeField, Min(0f)] private float turnSmooth = 14f;
        [SerializeField] private float jumpHeight = 1.15f;
        [SerializeField] private float gravity = -22f;
        [Header("Collision")]
        [SerializeField] private float standingHeight = 1.8f;
        [SerializeField] private float crouchingHeight = 1.15f;
        [SerializeField] private LayerMask overheadObstacles = ~0;
        [Header("References")]
        [SerializeField] private Transform cameraPivot;
        [SerializeField] private Animator animator;

        private CharacterController controller;
        private Vector3 velocity;
        private bool crouched;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            controller.height = standingHeight;
            controller.center = Vector3.up * standingHeight * 0.5f;
            if (!animator) animator = GetComponentInChildren<Animator>();
            if (!cameraPivot && Camera.main) cameraPivot = Camera.main.transform;
        }

        private void Update()
        {
            // Keyboard prototype; Unity Project Settings > Active Input Handling = Both or Input Manager.
            float horizontal = Input.GetAxisRaw("Horizontal");
            float vertical = Input.GetAxisRaw("Vertical");
            Vector2 input = Vector2.ClampMagnitude(new Vector2(horizontal, vertical), 1f);

            if (Input.GetKeyDown(KeyCode.C))
            {
                if (crouched) { if (CanStand()) crouched = false; }
                else crouched = true;
            }

            float desiredHeight = crouched ? crouchingHeight : standingHeight;
            controller.height = Mathf.MoveTowards(controller.height, desiredHeight, Time.deltaTime * 3.5f);
            controller.center = Vector3.up * controller.height * 0.5f;

            Transform basis = cameraPivot ? cameraPivot : transform;
            Vector3 forward = Vector3.ProjectOnPlane(basis.forward, Vector3.up).normalized;
            Vector3 right = Vector3.ProjectOnPlane(basis.right, Vector3.up).normalized;
            Vector3 direction = forward * input.y + right * input.x;
            if (direction.sqrMagnitude > 0.001f)
            {
                Quaternion target = Quaternion.LookRotation(direction, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, target, 1f - Mathf.Exp(-turnSmooth * Time.deltaTime));
            }
            bool sprint = !crouched && Input.GetKey(KeyCode.LeftShift) && input.y > 0.1f;
            float speed = crouched ? crouchSpeed : sprint ? sprintSpeed : walkSpeed;
            controller.Move(direction * speed * Time.deltaTime);

            bool grounded = controller.isGrounded;
            if (grounded && velocity.y < 0f) velocity.y = -2f;
            if (grounded && !crouched && Input.GetButtonDown("Jump"))
                velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            velocity.y += gravity * Time.deltaTime;
            controller.Move(velocity * Time.deltaTime);

            if (animator)
            {
                animator.SetFloat("Speed", input.magnitude * (sprint ? 2f : crouched ? 0.5f : 1f), 0.12f, Time.deltaTime);
                animator.SetBool("Grounded", controller.isGrounded);
                animator.SetBool("Crouched", crouched);
            }
        }

        private bool CanStand()
        {
            float radius = Mathf.Max(0.05f, controller.radius * 0.92f);
            Vector3 feet = transform.position + controller.center - Vector3.up * (controller.height * 0.5f);
            Vector3 lower = feet + Vector3.up * radius;
            Vector3 upper = feet + Vector3.up * (standingHeight - radius);
            // Ignore triggers; remove player's own layer from overheadObstacles in Inspector.
            return !Physics.CheckCapsule(lower, upper, radius, overheadObstacles, QueryTriggerInteraction.Ignore);
        }
    }
}
